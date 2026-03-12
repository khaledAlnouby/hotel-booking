import hotelService from '../services/hotelService.js';
import { ApiResponse } from '../utils/apiResponse.js';

class HotelController {
  /**
   * POST /api/hotels
   */
  async createHotel(req, res, next) {
    try {
      const hotel = await hotelService.createHotel(req.user.id, req.body);
      ApiResponse.created(res, hotel, 'Hotel created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hotels/:id
   */
  async getHotel(req, res, next) {
    try {
      const hotel = await hotelService.getHotelById(req.params.id);
      ApiResponse.success(res, hotel);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hotels
   */
  async searchHotels(req, res, next) {
    try {
      const { hotels, pagination } = await hotelService.searchHotels(req.query);
      ApiResponse.paginated(res, hotels, pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/hotels/:id
   */
  async updateHotel(req, res, next) {
    try {
      const hotel = await hotelService.updateHotel(req.params.id, req.user.id, req.body);
      ApiResponse.success(res, hotel, 'Hotel updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/hotels/:id
   */
  async deleteHotel(req, res, next) {
    try {
      const result = await hotelService.deleteHotel(req.params.id, req.user.id, req.user.role);
      ApiResponse.success(res, result, 'Hotel deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/hotels/owner/my-hotels
   */
  async getMyHotels(req, res, next) {
    try {
      const hotels = await hotelService.getOwnerHotels(req.user.id);
      ApiResponse.success(res, hotels);
    } catch (error) {
      next(error);
    }
  }
}

export default new HotelController();
