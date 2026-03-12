import prisma from '../config/database.js';
import { ApiError } from '../utils/apiResponse.js';

class HotelService {
  /**
   * Create a new hotel (Owner only).
   */
  async createHotel(ownerId, data) {
    const hotel = await prisma.hotel.create({
      data: {
        ...data,
        ownerId,
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return hotel;
  }

  /**
   * Get a hotel by ID with full details.
   */
  async getHotelById(hotelId) {
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        rooms: {
          where: { isActive: true },
          orderBy: { pricePerNight: 'asc' },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true, favorites: true },
        },
      },
    });

    if (!hotel) {
      throw ApiError.notFound('Hotel not found');
    }

    // Calculate average rating
    const avgRating = hotel.reviews.length > 0
      ? hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / hotel.reviews.length
      : 0;

    return { ...hotel, avgRating: Math.round(avgRating * 10) / 10 };
  }

  /**
   * Search hotels with advanced filters.
   */
  async searchHotels(filters) {
    const {
      city,
      country,
      checkIn,
      checkOut,
      minPrice,
      maxPrice,
      stars,
      amenities,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where = { isActive: true };

    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (stars) where.stars = { gte: stars };

    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim());
      where.amenities = { hasEvery: amenityList };
    }

    // Price filter via rooms
    if (minPrice || maxPrice) {
      where.rooms = {
        some: {
          isActive: true,
          ...(minPrice && { pricePerNight: { gte: minPrice } }),
          ...(maxPrice && { pricePerNight: { lte: maxPrice } }),
        },
      };
    }

    const skip = (page - 1) * limit;

    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        include: {
          rooms: {
            where: { isActive: true },
            orderBy: { pricePerNight: 'asc' },
            take: 1,
          },
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: { reviews: true },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy === 'rating' ? 'createdAt' : sortBy]: sortOrder },
      }),
      prisma.hotel.count({ where }),
    ]);

    // Add average rating and starting price
    const enrichedHotels = hotels.map((hotel) => {
      const avgRating = hotel.reviews.length > 0
        ? hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / hotel.reviews.length
        : 0;
      const startingPrice = hotel.rooms[0]?.pricePerNight || 0;

      const { reviews, ...hotelData } = hotel;
      return {
        ...hotelData,
        avgRating: Math.round(avgRating * 10) / 10,
        startingPrice,
      };
    });

    // Sort by rating if requested (post-process since it's computed)
    if (sortBy === 'rating') {
      enrichedHotels.sort((a, b) =>
        sortOrder === 'desc' ? b.avgRating - a.avgRating : a.avgRating - b.avgRating
      );
    }

    return {
      hotels: enrichedHotels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a hotel (Owner only).
   */
  async updateHotel(hotelId, ownerId, data) {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw ApiError.notFound('Hotel not found');
    if (hotel.ownerId !== ownerId) throw ApiError.forbidden('You can only update your own hotels');

    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelId },
      data,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return updatedHotel;
  }

  /**
   * Delete a hotel (Owner or Admin).
   */
  async deleteHotel(hotelId, userId, userRole) {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw ApiError.notFound('Hotel not found');

    if (userRole !== 'ADMIN' && hotel.ownerId !== userId) {
      throw ApiError.forbidden('You can only delete your own hotels');
    }

    await prisma.hotel.delete({ where: { id: hotelId } });
    return { id: hotelId };
  }

  /**
   * Get all hotels for a specific owner.
   */
  async getOwnerHotels(ownerId) {
    const hotels = await prisma.hotel.findMany({
      where: { ownerId },
      include: {
        rooms: {
          select: { id: true, name: true, type: true, pricePerNight: true, quantity: true },
        },
        _count: {
          select: { reviews: true, rooms: true, favorites: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return hotels.map((hotel) => {
      const avgRating = hotel.reviews.length > 0
        ? hotel.reviews.reduce((sum, r) => sum + r.rating, 0) / hotel.reviews.length
        : 0;
      const { reviews, ...hotelData } = hotel;
      return { ...hotelData, avgRating: Math.round(avgRating * 10) / 10 };
    });
  }
}

export default new HotelService();
