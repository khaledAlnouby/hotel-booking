import notificationService from '../services/notificationService.js';
import { ApiResponse } from '../utils/apiResponse.js';

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getUserNotifications(req.user.id);
      ApiResponse.success(res, notifications);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      ApiResponse.success(res, { count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user.id);
      ApiResponse.success(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      ApiResponse.success(res, result, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
