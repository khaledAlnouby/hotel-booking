import { Router } from 'express';
import favoriteController from '../controllers/favoriteController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/:hotelId', favoriteController.toggleFavorite);
router.get('/', favoriteController.getFavorites);

export default router;
