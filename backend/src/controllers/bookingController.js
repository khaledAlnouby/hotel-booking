import bookingService from '../services/bookingService.js';
import { ApiResponse } from '../utils/apiResponse.js';

class BookingController {
  /**
   * POST /api/bookings
   */
  async createBooking(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.user.id, req.body);
      ApiResponse.created(res, booking, 'Booking created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings
   */
  async getBookings(req, res, next) {
    try {
      const { status } = req.query;
      let bookings;

      if (req.user.role === 'OWNER') {
        bookings = await bookingService.getOwnerBookings(req.user.id, status);
      } else {
        bookings = await bookingService.getUserBookings(req.user.id, status);
      }

      ApiResponse.success(res, bookings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings/:id
   */
  async getBooking(req, res, next) {
    try {
      const booking = await bookingService.getBookingById(req.params.id, req.user.id);
      ApiResponse.success(res, booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/bookings/:id/cancel
   */
  async cancelBooking(req, res, next) {
    try {
      const booking = await bookingService.cancelBooking(req.params.id, req.user.id);
      ApiResponse.success(res, booking, 'Booking cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new BookingController();
