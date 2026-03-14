import { Router } from 'express';
import roomController from '../controllers/roomController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createRoomSchema, updateRoomSchema } from '../validators/schemas.js';

const router = Router();

// Hotel rooms (public)
router.get('/hotels/:hotelId/rooms', roomController.getHotelRooms);

// Single room (public — used by Checkout page fallback)
router.get('/rooms/:id', roomController.getRoomById);

// Room availability (public)
router.get('/rooms/:id/availability', roomController.checkAvailability);

// Create room for a hotel (Owner only)
router.post(
  '/hotels/:hotelId/rooms',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  validate(createRoomSchema),
  roomController.createRoom
);

// Update / Delete room (Owner only)
router.put('/rooms/:id', authenticate, authorize('OWNER', 'ADMIN'), validate(updateRoomSchema), roomController.updateRoom);
router.delete('/rooms/:id', authenticate, authorize('OWNER', 'ADMIN'), roomController.deleteRoom);

export default router;
