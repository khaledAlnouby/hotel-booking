import reviewService from '../services/reviewService.js';
import { ApiResponse } from '../utils/apiResponse.js';

class ReviewController {
  async createReview(req, res, next) {
    try {
      const review = await reviewService.createReview(req.user.id, req.body);
      ApiResponse.created(res, review, 'Review submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getHotelReviews(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await reviewService.getHotelReviews(
        req.params.hotelId,
        parseInt(page) || 1,
        parseInt(limit) || 10
      );
      ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const result = await reviewService.deleteReview(req.params.id, req.user.id);
      ApiResponse.success(res, result, 'Review deleted');
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
