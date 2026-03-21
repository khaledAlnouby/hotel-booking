import favoriteService from '../services/favoriteService.js';
import { ApiResponse } from '../utils/apiResponse.js';

class FavoriteController {
  async toggleFavorite(req, res, next) {
    try {
      const result = await favoriteService.toggleFavorite(req.user.id, req.params.hotelId);
      ApiResponse.success(res, result, result.isFavorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      next(error);
    }
  }

  async getFavorites(req, res, next) {
    try {
      const favorites = await favoriteService.getUserFavorites(req.user.id);
      ApiResponse.success(res, favorites);
    } catch (error) {
      next(error);
    }
  }
}

export default new FavoriteController();
