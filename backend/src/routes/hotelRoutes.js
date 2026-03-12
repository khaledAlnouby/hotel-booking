import { Router } from 'express';
import hotelController from '../controllers/hotelController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createHotelSchema, updateHotelSchema, searchHotelsSchema } from '../validators/schemas.js';

const router = Router();

// Public routes
router.get('/', validate(searchHotelsSchema, 'query'), hotelController.searchHotels);
router.get('/owner/my-hotels', authenticate, authorize('OWNER'), hotelController.getMyHotels);
router.get('/:id', hotelController.getHotel);

// Protected routes (Owner)
router.post('/', authenticate, authorize('OWNER', 'ADMIN'), validate(createHotelSchema), hotelController.createHotel);
router.put('/:id', authenticate, authorize('OWNER', 'ADMIN'), validate(updateHotelSchema), hotelController.updateHotel);
router.delete('/:id', authenticate, authorize('OWNER', 'ADMIN'), hotelController.deleteHotel);

// Owner-specific

export default router;
