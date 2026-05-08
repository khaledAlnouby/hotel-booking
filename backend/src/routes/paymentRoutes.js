import { Router } from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBookingSchema } from '../validators/schemas.js';

const router = Router();

// ── Protected routes ──────────────────────────────────────────────────────────

router.post(
  '/create-checkout-session',
  authenticate,
  validate(createBookingSchema),
  paymentController.createCheckoutSession,
);

router.get(
  '/verify-session/:sessionId',
  authenticate,
  paymentController.verifySession,
);

router.post(
  '/cancel-reservation/:reservationId',
  authenticate,
  paymentController.cancelReservation,
);

// NOTE: /webhook is registered directly in server.js (before express.json)
// so that it receives the raw body required by stripe.webhooks.constructEvent.

export default router;
