import prisma from '../config/database.js';
import { ApiError } from '../utils/apiResponse.js';

class FavoriteService {
  /**
   * Toggle favorite status for a hotel.
   */
  async toggleFavorite(userId, hotelId) {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw ApiError.notFound('Hotel not found');

    const existing = await prisma.favorite.findUnique({
      where: { userId_hotelId: { userId, hotelId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { isFavorited: false, hotelId };
    }

    await prisma.favorite.create({ data: { userId, hotelId } });
    return { isFavorited: true, hotelId };
  }

  /**
   * Get user's favorite hotels.
   */
  async getUserFavorites(userId) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        hotel: {
          include: {
            rooms: {
              where: { isActive: true },
              orderBy: { pricePerNight: 'asc' },
              take: 1,
            },
            reviews: { select: { rating: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((fav) => {
      const avgRating = fav.hotel.reviews.length > 0
        ? fav.hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / fav.hotel.reviews.length
        : 0;
      const startingPrice = fav.hotel.rooms[0]?.pricePerNight || 0;

      const { reviews, ...hotelData } = fav.hotel;
      return {
        ...fav,
        hotel: {
          ...hotelData,
          avgRating: Math.round(avgRating * 10) / 10,
          startingPrice,
        },
      };
    });
  }
}

export default new FavoriteService();
