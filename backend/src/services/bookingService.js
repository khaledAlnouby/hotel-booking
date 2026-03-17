import prisma from '../config/database.js';
import { ApiError } from '../utils/apiResponse.js';

class BookingService {
  /**
   * Create a new reservation with availability validation and transaction.
   */
  async createBooking(userId, data) {
    const { roomId, checkIn, checkOut, guests, specialRequests } = data;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      throw ApiError.badRequest('Check-out date must be after check-in date');
    }

    if (checkInDate < new Date()) {
      throw ApiError.badRequest('Check-in date cannot be in the past');
    }

    // Calculate nights
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Use a transaction to prevent overbooking
    const reservation = await prisma.$transaction(async (tx) => {
      // Get room with hotel info
      const room = await tx.room.findUnique({
        where: { id: roomId },
        include: { hotel: true },
      });

      if (!room) throw ApiError.notFound('Room not found');
      if (!room.isActive) throw ApiError.badRequest('This room is no longer available');

      // Check guest capacity
      if (guests > room.capacity) {
        throw ApiError.badRequest(`Room capacity is ${room.capacity} guests`);
      }

      // Count overlapping active reservations
      const overlapping = await tx.reservation.count({
        where: {
          roomId,
          status: { notIn: ['CANCELLED', 'PENDING'] },
          checkIn: { lt: checkOutDate },
          checkOut: { gt: checkInDate },
        },
      });

      if (overlapping >= room.quantity) {
        throw ApiError.conflict('No rooms available for the selected dates');
      }

      // Calculate total price
      const totalPrice = room.pricePerNight * nights;

      // Create the reservation
      const newReservation = await tx.reservation.create({
        data: {
          userId,
          roomId,
          hotelName: room.hotel.name,
          roomName: room.name,
          checkIn: checkInDate,
          checkOut: checkOutDate,
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
                select: { id: true, name: true, address: true, city: true, country: true, thumbnail: true },
              },
            },
          },
        },
      });

      // Create a payment record (pending)
      await tx.payment.create({
        data: {
          reservationId: newReservation.id,
          amount: totalPrice,
          status: 'PENDING',
        },
      });

      return newReservation;
    });

    return reservation;
  }

  /**
   * Get bookings for a user.
   */
  async getUserBookings(userId, status) {
    const where = { userId };
    if (status) where.status = status;

    const bookings = await prisma.reservation.findMany({
      where,
      include: {
        room: {
          include: {
            hotel: {
              select: { id: true, name: true, city: true, country: true, thumbnail: true, images: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }

  /**
   * Get bookings for an owner's hotels.
   */
  async getOwnerBookings(ownerId, status) {
    const where = {
      room: { hotel: { ownerId } },
    };
    if (status) where.status = status;

    const bookings = await prisma.reservation.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        room: {
          include: {
            hotel: { select: { id: true, name: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }

  /**
   * Get a single booking by ID.
   */
  async getBookingById(bookingId, userId) {
    const booking = await prisma.reservation.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        room: {
          include: {
            hotel: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) throw ApiError.notFound('Booking not found');

    // Only allow the booker or the hotel owner to view
    if (booking.userId !== userId && booking.room.hotel.ownerId !== userId) {
      throw ApiError.forbidden('You are not authorized to view this booking');
    }

    return booking;
  }

  /**
   * Cancel a booking.
   */
  async cancelBooking(bookingId, userId) {
    const booking = await prisma.reservation.findUnique({
      where: { id: bookingId },
      include: { room: { include: { hotel: true } } },
    });

    if (!booking) throw ApiError.notFound('Booking not found');

    // Only allow the booker or hotel owner to cancel
    if (booking.userId !== userId && booking.room.hotel.ownerId !== userId) {
      throw ApiError.forbidden('You are not authorized to cancel this booking');
    }

    if (booking.status === 'CANCELLED') {
      throw ApiError.badRequest('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw ApiError.badRequest('Cannot cancel a completed booking');
    }

    const updatedBooking = await prisma.reservation.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
      include: { payment: true },
    });

    // Update payment status
    if (updatedBooking.payment) {
      await prisma.payment.update({
        where: { id: updatedBooking.payment.id },
        data: { status: 'REFUNDED' },
      });
    }

    return updatedBooking;
  }
}

export default new BookingService();
