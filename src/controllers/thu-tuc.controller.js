import { successResponse } from '../utils/response.util.js';
import ThuTucService from '../services/thu-tuc.service.js';

const ThuTucController = {
    async getThuTucBasicDetails(req, res) {
        const { id } = req.params; // Lấy ID thủ tục từ URL params
        const procedure = await ThuTucService.getThuTucBasicDetails(id); // Gọi service để lấy dữ liệu
        return successResponse(res, procedure, 'Lấy thông tin thủ tục thành công'); // Trả về phản hồi thành công
    },

    async getFullThuTucDetails(req, res) {
        const { id } = req.params; // Lấy ID thủ tục từ URL params
        const procedure = await ThuTucService.getFullProcedureDetails(id);
        return successResponse(res, procedure, 'Lấy thông tin chi tiết đầy đủ thủ tục thành công');
    },

    async search(req, res) {
        const { keyword, linhVucId } = req.query;
        const thuTucs = await ThuTucService.searchThuTuc({ keyword, linhVucId });
        return successResponse(res, thuTucs, "Tìm Kiếm thủ tục thành công");
    },

    async getMauDonByThuTucId(req, res) {
        const { id } = req.params;
        const result = await ThuTucService.getMauDonByThuTucId(id);
        return successResponse(res, result, "Lấy danh sách mẫu đơn thành công");
    },
};

export default ThuTucController;
