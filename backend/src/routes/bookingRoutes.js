import { Router } from 'express';
import bookingController from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBookingSchema } from '../validators/schemas.js';

const router = Router();

// All booking routes are protected
router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBooking);
router.put('/:id/cancel', bookingController.cancelBooking);

export default router;
