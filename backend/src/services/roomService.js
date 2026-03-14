import prisma from '../config/database.js';
import { ApiError } from '../utils/apiResponse.js';

class RoomService {
  /**
   * Add a room to a hotel (Owner only).
   */
  async createRoom(hotelId, ownerId, data) {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw ApiError.notFound('Hotel not found');
    if (hotel.ownerId !== ownerId) throw ApiError.forbidden('You can only add rooms to your own hotels');

    const room = await prisma.room.create({
      data: { ...data, hotelId },
    });

    return room;
  }

  /**
   * Update a room.
   */
  async updateRoom(roomId, ownerId, data) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hotel: { select: { ownerId: true } } },
    });
    if (!room) throw ApiError.notFound('Room not found');
    if (room.hotel.ownerId !== ownerId) throw ApiError.forbidden('You can only update rooms in your own hotels');

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data,
    });

    return updatedRoom;
  }

  /**
   * Delete a room.
   */
  async deleteRoom(roomId, ownerId) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { hotel: { select: { ownerId: true } } },
    });
    if (!room) throw ApiError.notFound('Room not found');
    if (room.hotel.ownerId !== ownerId) throw ApiError.forbidden('You can only delete rooms in your own hotels');

    await prisma.room.delete({ where: { id: roomId } });
    return { id: roomId };
  }

  /**
   * Get a single room by ID (public).
   */
  async getRoomById(roomId) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: {
          select: { id: true, name: true, city: true, country: true, thumbnail: true, stars: true },
        },
      },
    });
    if (!room) throw ApiError.notFound('Room not found');
    return room;
  }

  /**
   * Get rooms for a hotel.
   */
  async getHotelRooms(hotelId) {
    const rooms = await prisma.room.findMany({
      where: { hotelId, isActive: true },
      orderBy: { pricePerNight: 'asc' },
    });

    return rooms;
  }

  /**
   * Check room availability for a date range.
   */
  async checkAvailability(roomId, checkIn, checkOut) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw ApiError.notFound('Room not found');

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Count overlapping reservations that are not cancelled
    const overlappingReservations = await prisma.reservation.count({
      where: {
        roomId,
        status: { notIn: ['CANCELLED'] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });

    const availableQuantity = room.quantity - overlappingReservations;

    return {
      roomId,
      roomName: room.name,
      totalQuantity: room.quantity,
      bookedQuantity: overlappingReservations,
      availableQuantity: Math.max(0, availableQuantity),
      isAvailable: availableQuantity > 0,
      checkIn,
      checkOut,
    };
  }
}

export default new RoomService();
