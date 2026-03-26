import { Router } from 'express';
import adminController from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
