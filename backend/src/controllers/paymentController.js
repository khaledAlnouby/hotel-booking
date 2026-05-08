import paymentService from '../services/paymentService.js';
import { ApiResponse } from '../utils/apiResponse.js';

class PaymentController {
  /**
   * POST /api/payments/create-checkout-session
   * Creates a PENDING reservation and returns a Stripe Checkout URL.
   */
  async createCheckoutSession(req, res, next) {
    try {
      const result = await paymentService.createCheckoutSession(req.user.id, req.body);
      ApiResponse.success(res, result, 'Checkout session created');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/verify-session/:sessionId
   * Verifies the Stripe session after redirect and confirms the reservation.
   * Acts as a fallback for environments where webhooks are not configured.
   */
  async verifySession(req, res, next) {
    try {
      const reservation = await paymentService.verifyAndConfirmSession(
        req.params.sessionId,
        req.user.id,
      );
      ApiResponse.success(res, reservation, 'Payment verified and booking confirmed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/cancel-reservation/:reservationId
   * Cancels a PENDING reservation when the user abandons the Stripe page.
   */
  async cancelReservation(req, res, next) {
    try {
      const result = await paymentService.cancelPendingReservation(
        req.params.reservationId,
        req.user.id,
      );
      ApiResponse.success(res, result, 'Reservation cancelled');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/webhook
   * Stripe webhook handler — MUST receive the raw (unparsed) request body.
   */
  async webhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'];
      const result = await paymentService.handleWebhook(req.body, signature);
      res.json(result);
    } catch (error) {
      // Stripe expects a 400 on bad webhook payloads
      res.status(400).json({ error: error.message });
    }
  }
}

export default new PaymentController();
