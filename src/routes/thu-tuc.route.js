import express from 'express';
import ThuTucController from '../controllers/thu-tuc.controller.js';

const thuTucRoute = express.Router();

/**
 * GET /api/thu-tuc/:id/mau-don
 * Lấy danh sách mẫu đơn theo id thủ tục hành chính
 * 
 * @route GET /thu-tuc/:id/mau-don
 * @group Thu tuc - Quản lý thủ tục hành chính
 * @param {string} id.path.required - ID của thủ tục hành chính
 */
thuTucRoute.get('/:id/mau-don', ThuTucController.getMauDonByThuTucId);

export default thuTucRoute;
