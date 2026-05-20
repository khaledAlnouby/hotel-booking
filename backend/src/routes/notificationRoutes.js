import { Router } from 'express';
import notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/',              notificationController.getNotifications);
router.get('/unread-count',  notificationController.getUnreadCount);
router.patch('/:id/read',    notificationController.markAsRead);
router.patch('/read-all',    notificationController.markAllAsRead);

export default router;
