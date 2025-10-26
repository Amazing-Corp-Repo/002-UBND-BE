import express from 'express';
import MauDonController from '../controllers/mau-don.controller.js';

const mauDonRoute = express.Router();

/**
 * GET /api/thu-tuc/:id/mau-don
 * Lấy danh sách mẫu đơn theo id thủ tục hành chính
 * 
 * @route GET /thu-tuc/:id/mau-don
 * @group Mau don - Quản lý mẫu đơn
 * @param {string} id.path.required - ID của thủ tục hành chính
 */
mauDonRoute.get('/:id/mau-don', MauDonController.getMauDonByThuTucId);

export default mauDonRoute;

