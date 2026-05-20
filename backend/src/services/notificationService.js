import prisma from '../config/database.js';
import { getIO } from '../config/socketManager.js';

class NotificationService {
  /**
   * Create a notification and push it to the user in real-time if they are online.
   */
  async createNotification(userId, type, title, message) {
    const notification = await prisma.notification.create({
      data: { userId, type, title, message },
    });

    // Push real-time if the user's socket is connected
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', notification);
    }

    return notification;
  }

  /**
   * Get the most recent notifications for a user.
   */
  async getUserNotifications(userId, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Count unread notifications.
   */
  async getUnreadCount(userId) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== userId) return null;

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications for a user as read.
   */
  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}

export default new NotificationService();
