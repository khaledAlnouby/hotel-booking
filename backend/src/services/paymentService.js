import Stripe from 'stripe';
import prisma from '../config/database.js';
import { ApiError } from '../utils/apiResponse.js';
import notificationService from './notificationService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  /**
   * Create a Stripe Checkout Session for a new reservation.
   * Creates a PENDING reservation, then hands off to Stripe for payment.
   */
  async createCheckoutSession(userId, data) {
    const { roomId, checkIn, checkOut, guests, specialRequests } = data;

    const checkInDate  = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      throw ApiError.badRequest('Check-out date must be after check-in date');
    }
    if (checkInDate < new Date()) {
      throw ApiError.badRequest('Check-in date cannot be in the past');
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Create PENDING reservation inside a transaction (prevents overbooking)
    const reservation = await prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { hotel: true },
      });

      if (!room)        throw ApiError.notFound('Room not found');
      if (!room.isActive) throw ApiError.badRequest('This room is no longer available');

      if (guests > room.capacity) {
        throw ApiError.badRequest(`Room capacity is ${room.capacity} guests`);
      }

      // Only count CONFIRMED/COMPLETED reservations — PENDING ones haven't been
      // paid yet and must not block new booking attempts.
      const overlapping = await tx.reservation.count({
        where: {
          roomId,
          status: { notIn: ['CANCELLED', 'PENDING'] },
          checkIn:  { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      });

      if (overlapping >= room.quantity) {
        throw ApiError.conflict('No rooms available for the selected dates');
      }

      const totalPrice = room.pricePerNight * nights;

      const newReservation = await tx.reservation.create({
        data: {
          userId,
          roomId,
          hotelName:       room.hotel.name,
          roomName:        room.name,
          checkIn:         checkInDate,
          checkOut:        checkOutDate,
          nights,
          guests,
          totalPrice,
          specialRequests,
          status: 'PENDING',
        },
        include: {
          room: {
            include: {
              hotel: {
                select: { id: true, name: true, city: true, thumbnail: true },
              },
            },
          },
        },
      });

      await tx.payment.create({
        data: {
          reservationId: newReservation.id,
          amount:        totalPrice,
          status:        'PENDING',
        },
      });

      return newReservation;
    });

    // Build the Stripe Checkout Session.
    // If Stripe throws (e.g. invalid API key), cancel the PENDING reservation
    // immediately so it doesn't block future booking attempts.
    let session;
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const backendUrl  = process.env.BACKEND_URL  || `http://localhost:${process.env.PORT || 5000}`;
      const tax         = reservation.totalPrice * 0.1;
      const grandTotal  = Math.round((reservation.totalPrice + tax) * 100); // cents

      // Stripe requires absolute URLs for images. Thumbnails are stored as
      // relative paths (/uploads/…), so we prepend the backend origin.
      const thumbnail = reservation.room?.hotel?.thumbnail;
      const imageUrl  = thumbnail
        ? (thumbnail.startsWith('http') ? thumbnail : `${backendUrl}${thumbnail}`)
        : null;

      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode:                 'payment',
        line_items: [
          {
            price_data: {
              currency:     'usd',
              unit_amount:  grandTotal,
              product_data: {
                name: `${reservation.hotelName} — ${reservation.roomName}`,
                description: `${nights} night${nights !== 1 ? 's' : ''} · ${checkIn} → ${checkOut}`,
                ...(imageUrl ? { images: [imageUrl] } : {}),
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          reservationId: reservation.id,
          userId,
        },
        success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${frontendUrl}/payment/cancel?reservation_id=${reservation.id}`,
        expires_at:  Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
      });
    } catch (stripeErr) {
      // Roll back: cancel the reservation so the room stays bookable
      await prisma.$transaction([
        prisma.reservation.update({
          where: { id: reservation.id },
          data:  { status: 'CANCELLED' },
        }),
        prisma.payment.updateMany({
          where: { reservationId: reservation.id },
          data:  { status: 'FAILED' },
        }),
      ]).catch(() => {}); // ignore cleanup errors

      throw ApiError.internal(
        `Payment provider error: ${stripeErr.message ?? 'Unable to create checkout session'}`,
      );
    }

    // Save session ID so we can look it up on the success page
    await prisma.payment.update({
      where: { reservationId: reservation.id },
      data:  { stripeSessionId: session.id },
    });

    return { url: session.url, reservationId: reservation.id };
  }

  /**
   * Verify a Stripe Checkout Session and confirm the reservation.
   * Called by the success page as a fallback when webhooks aren't configured.
   */
  async verifyAndConfirmSession(sessionId, userId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw ApiError.notFound('Payment session not found');
    }

    // Only the session owner may verify
    if (session.metadata?.userId !== userId) {
      throw ApiError.forbidden('Not authorized');
    }

    if (session.payment_status !== 'paid') {
      throw ApiError.badRequest('Payment has not been completed');
    }

    return this._confirmReservation(session);
  }

  /**
   * Handle Stripe webhook events.
   * @param {Buffer} rawBody - raw request body (must NOT be JSON-parsed)
   * @param {string} signature - value of the stripe-signature header
   */
  async handleWebhook(rawBody, signature) {
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      throw ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      await this._confirmReservation(event.data.object);
    }

    if (event.type === 'checkout.session.expired') {
      await this._cancelPendingReservation(event.data.object.metadata?.reservationId);
    }

    return { received: true };
  }

  /**
   * Cancel a pending reservation (user abandoned Stripe, or session expired).
   */
  async cancelPendingReservation(reservationId, userId) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) throw ApiError.notFound('Reservation not found');
    if (reservation.userId !== userId) throw ApiError.forbidden('Not authorized');
    if (reservation.status !== 'PENDING') {
      throw ApiError.badRequest('Only pending reservations can be cancelled this way');
    }

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservationId },
        data:  { status: 'CANCELLED' },
      }),
      prisma.payment.updateMany({
        where: { reservationId },
        data:  { status: 'FAILED' },
      }),
    ]);

    return { cancelled: true };
  }

  // ─── private ──────────────────────────────────────────────────────────────

  async _confirmReservation(session) {
    const reservationId = session.metadata?.reservationId;
    if (!reservationId) return null;

    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    // Idempotent — skip if already confirmed
    if (!existing || existing.status === 'CONFIRMED') return existing;

    const [updated] = await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservationId },
        data:  { status: 'CONFIRMED' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
          room: {
            include: {
              hotel: {
                select: { id: true, name: true, city: true, thumbnail: true, ownerId: true },
              },
            },
          },
          payment: true,
        },
      }),
      prisma.payment.updateMany({
        where: { reservationId },
        data: {
          status:           'SUCCEEDED',
          stripeSessionId:  session.id,
          stripePaymentId:  session.payment_intent ?? null,
        },
      }),
    ]);

    // Notify the hotel owner and all admins
    const ownerId   = updated.room?.hotel?.ownerId;
    const guestName = [updated.user?.firstName, updated.user?.lastName]
      .filter(Boolean).join(' ') || 'A guest';
    const hotelName = updated.room?.hotel?.name ?? updated.hotelName;
    const dateRange = `${updated.checkIn.toISOString().slice(0, 10)} → ${updated.checkOut.toISOString().slice(0, 10)}`;
    const nights    = updated.nights;

    if (ownerId) {
      notificationService.createNotification(
        ownerId,
        'BOOKING',
        `New booking at ${hotelName}`,
        `${guestName} booked ${updated.roomName} for ${nights} night${nights !== 1 ? 's' : ''} (${dateRange}).`,
      ).catch(() => {});
    }

    notificationService.notifyAllAdmins(
      'BOOKING',
      `Booking confirmed — ${hotelName}`,
      `${guestName} confirmed a reservation at ${hotelName} (${updated.roomName}) for ${nights} night${nights !== 1 ? 's' : ''} (${dateRange}).`,
    ).catch(() => {});

    return updated;
  }

  async _cancelPendingReservation(reservationId) {
    if (!reservationId) return;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation || reservation.status !== 'PENDING') return;

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservationId },
        data:  { status: 'CANCELLED' },
      }),
      prisma.payment.updateMany({
        where: { reservationId },
        data:  { status: 'FAILED' },
      }),
    ]);
  }
}

export default new PaymentService();
