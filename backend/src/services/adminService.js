import prisma from '../config/database.js';
import { ApiError } from '../utils/apiResponse.js';

class AdminService {
  /**
   * Get platform dashboard metrics.
   */
  async getDashboardMetrics() {
    const [
      totalUsers,
      totalHotels,
      totalBookings,
      totalRevenue,
      recentBookings,
      usersByRole,
      bookingsByStatus,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.hotel.count(),
      prisma.reservation.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCEEDED' },
      }),
      prisma.reservation.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          room: { select: { name: true, hotel: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.reservation.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    return {
      totalUsers,
      totalHotels,
      totalBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentBookings,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {}),
      bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
    };
  }

  /**
   * Get all users with pagination.
   */
  async getUsers(page = 1, limit = 20, role, search) {
    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { reservations: true, reviews: true, hotels: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get all bookings with pagination, search, and status filter.
   */
  async getBookings(page = 1, limit = 20, status, search) {
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName:  { contains: search, mode: 'insensitive' } } },
        { room: { hotel: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          room: { select: { name: true, hotel: { select: { name: true } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reservation.count({ where }),
    ]);

    return {
      bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Cancel a booking (admin override).
   */
  async cancelBooking(reservationId) {
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw ApiError.notFound('Booking not found');
    if (reservation.status === 'CANCELLED') throw ApiError.badRequest('Booking is already cancelled');

    return prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * Update user status (ban/activate).
   */
  async updateUserStatus(userId, isActive) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    if (user.role === 'ADMIN') throw ApiError.forbidden('Cannot modify admin accounts');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    return updated;
  }

}

export default new AdminService();
