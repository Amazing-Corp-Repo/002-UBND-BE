import express from 'express';
import ThuTucController from '../controllers/thu-tuc.controller.js';
import { GetMauDonByThuTucIdParams } from '../schemas/thu-tuc.schema.js';
import validate from '../middlewares/validate.middleware.js';

const thuTucRoute = express.Router();

/**
 * GET /api/thu-tuc/:id/mau-don
 * Lấy danh sách mẫu đơn theo id thủ tục hành chính
 * 
 * @route GET /thu-tuc/:id/mau-don
 * @group Thu tuc - Quản lý thủ tục hành chính
 * @param {string} id.path.required - ID của thủ tục hành chính
 * @returns {object} 200 - Danh sách mẫu đơn
 * @returns {Error} 404 - Không tìm thấy thủ tục
 * @returns {Error} 500 - Lỗi server
 */
thuTucRoute.get('/:id/mau-don', validate(GetMauDonByThuTucIdParams, 'params'), ThuTucController.getMauDonByThuTucId);

export default thuTucRoute;
