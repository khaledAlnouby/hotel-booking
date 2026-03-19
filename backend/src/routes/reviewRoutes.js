import { Router } from 'express';
import reviewController from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createReviewSchema } from '../validators/schemas.js';

const router = Router();

// Public
router.get('/hotels/:hotelId/reviews', reviewController.getHotelReviews);

// Protected
router.post('/', authenticate, validate(createReviewSchema), reviewController.createReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
