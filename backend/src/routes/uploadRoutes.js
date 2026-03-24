import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';

const router = Router();

/**
 * POST /api/upload
 * Upload a single image. Returns { url } pointing to the hosted file.
 */
router.post(
  '/',
  authenticate,
  upload.single('image'),
  (req, res, next) => {
    try {
      if (!req.file) {
        throw new ApiError(400, 'No file provided');
      }
      const url = `/uploads/${req.file.filename}`;
      ApiResponse.created(res, { url }, 'File uploaded successfully');
    } catch (err) {
      next(err);
    }
  },
);

export default router;
