import roomService from '../services/roomService.js';
import { ApiResponse } from '../utils/apiResponse.js';

class RoomController {
  /**
   * POST /api/hotels/:hotelId/rooms
   */
  async createRoom(req, res, next) {
    try {
      const room = await roomService.createRoom(req.params.hotelId, req.user.id, req.body);
      ApiResponse.created(res, room, 'Room added successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/rooms/:id
   */
  async updateRoom(req, res, next) {
    try {
      const room = await roomService.updateRoom(req.params.id, req.user.id, req.body);
      ApiResponse.success(res, room, 'Room updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/rooms/:id
   */
  async deleteRoom(req, res, next) {
    try {
      const result = await roomService.deleteRoom(req.params.id, req.user.id);
      ApiResponse.success(res, result, 'Room deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rooms/:id
   */
  async getRoomById(req, res, next) {
    try {
      const room = await roomService.getRoomById(req.params.id);
      ApiResponse.success(res, room);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hotels/:hotelId/rooms
   */
  async getHotelRooms(req, res, next) {
    try {
      const rooms = await roomService.getHotelRooms(req.params.hotelId);
      ApiResponse.success(res, rooms);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/rooms/:id/availability
   */
  async checkAvailability(req, res, next) {
    try {
      const { checkIn, checkOut } = req.query;
      if (!checkIn || !checkOut) {
        return res.status(400).json({ success: false, message: 'checkIn and checkOut query params are required' });
      }
      const availability = await roomService.checkAvailability(req.params.id, checkIn, checkOut);
      ApiResponse.success(res, availability);
    } catch (error) {
      next(error);
    }
  }
}

export default new RoomController();
