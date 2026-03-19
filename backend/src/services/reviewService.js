import prisma from '../config/database.js';
import { ApiError } from '../utils/apiResponse.js';

class ReviewService {
  /**
   * Create a review (only if user had a completed stay).
   */
  async createReview(userId, data) {
    const { hotelId, rating, title, comment } = data;

    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw ApiError.notFound('Hotel not found');

    // Check if user already reviewed this hotel
    const existingReview = await prisma.review.findUnique({
      where: { userId_hotelId: { userId, hotelId } },
    });
    if (existingReview) throw ApiError.conflict('You have already reviewed this hotel');

    const review = await prisma.review.create({
      data: { userId, hotelId, rating, title, comment },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    return review;
  }

  /**
   * Get reviews for a hotel.
   */
  async getHotelReviews(hotelId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { hotelId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { hotelId } }),
    ]);

    // Calculate rating distribution
    const allRatings = await prisma.review.findMany({
      where: { hotelId },
      select: { rating: true },
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allRatings.forEach((r) => { distribution[r.rating]++; });

    const avgRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0;

    return {
      reviews,
      stats: {
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: total,
        distribution,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Delete a review (own review only).
   */
  async deleteReview(reviewId, userId) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw ApiError.notFound('Review not found');
    if (review.userId !== userId) throw ApiError.forbidden('You can only delete your own reviews');

    await prisma.review.delete({ where: { id: reviewId } });
    return { id: reviewId };
  }
}

export default new ReviewService();
