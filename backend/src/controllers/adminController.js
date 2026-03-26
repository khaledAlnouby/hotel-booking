import adminService from '../services/adminService.js';
import { ApiResponse } from '../utils/apiResponse.js';

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const metrics = await adminService.getDashboardMetrics();
      ApiResponse.success(res, metrics);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const { page, limit, role, search } = req.query;
      const result = await adminService.getUsers(
        parseInt(page) || 1,
        parseInt(limit) || 20,
        role,
        search
      );
      ApiResponse.paginated(res, result.users, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { isActive } = req.body;
      const user = await adminService.updateUserStatus(req.params.id, isActive);
      ApiResponse.success(res, user, `User ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await adminService.getAuditLogs(parseInt(page) || 1, parseInt(limit) || 50);
      ApiResponse.paginated(res, result.logs, result.pagination);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
