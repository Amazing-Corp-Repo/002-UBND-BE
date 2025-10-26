
import { successResponse } from '../utils/response.util.js'; 
import * as ThuTucService from '../services/thu-tuc.service.js'; 

const ThuTucController = {
    async getThuTucById(req, res) {
        const { id } = req.params; // Lấy ID thủ tục từ URL params
        const procedure = await ThuTucService.getThuTucById(id); // Gọi service để lấy dữ liệu
        return successResponse(res, procedure, 'Lấy thông tin thủ tục thành công'); // Trả về phản hồi thành công
    },

    async getAllThuTuc(req, res) {
        // Lấy tham số phân trang từ query string, chuyển sang số nguyên
        const page = parseInt(req.query.page) || 1;
        const size = parseInt(req.query.size) || 10;

        const result = await ThuTucService.getAllThuTucWithBasicDetails(page, size);
        return successResponse(res, result, 'Lấy danh sách thủ tục thành công'); 
    },

    async getFullThuTucDetails(req, res) {
        const { id } = req.params; // Lấy ID thủ tục từ URL params
        const procedure = await ThuTucService.getThuTucAllDetails(id); 
        return successResponse(res, procedure, 'Lấy thông tin chi tiết đầy đủ thủ tục thành công'); 
    },
};

export default ThuTucController;