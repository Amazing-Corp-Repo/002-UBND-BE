import LinhVucPhanAnhService from "../services/linh-vuc-phan-anh.service.js";
import { successResponse } from "../utils/response.util.js";

const LinhVucPhanAnhController = {
    async createLinhVucPhanAnh(req, res) {
        const { ten, moTa } = req.body;
        const currentUser = req.payload.userId;
        const result = await LinhVucPhanAnhService.createLinhVucPhanAnh(ten, moTa, currentUser);
        return successResponse(res, result, 'Tạo lĩnh vực phản ánh thành công');
    },

    async getAllLinhVucPhanAnh(req, res) {
        let { page = 1, size = 10, search, isActive } = req.query;
        page = parseInt(page);
        size = parseInt(size);
        const result = await LinhVucPhanAnhService.getAllLinhVucPhanAnh(page, size, search, isActive);
        return successResponse(res, result.data, 'Lấy danh sách lĩnh vực phản ánh thành công', result.pagination);  
    },

    async updateLinhVucPhanAnh(req, res) {
        const { id } = req.params;
        const { ten, moTa } = req.body;
        const currentUser = req.payload.userId;
        const result = await LinhVucPhanAnhService.updateLinhVucPhanAnh(id, ten, moTa, currentUser);
        return successResponse(res, result, 'Cập nhật lĩnh vực phản ánh thành công');
    },

    async updateLinhVucPhanAnhStatus(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.payload.userId;
        const result = await LinhVucPhanAnhService.updateLinhVucPhanAnhStatus(id, isActive, currentUser);
        return successResponse(res, result, 'Cập nhật trạng thái lĩnh vực phản ánh thành công');
    },

    async getLinhVucPhanAnhById(req, res) {
        const { id } = req.params;
        const result = await LinhVucPhanAnhService.getLinhVucPhanAnhById(id);
        return successResponse(res, result, 'Lấy chi tiết lĩnh vực phản ánh thành công');
    },

    async deleteLinhVucPhanAnh(req, res) {
        const { id } = req.params;
        const currentUser = req.payload.userId;
        await LinhVucPhanAnhService.deleteLinhVucPhanAnh(id, currentUser);
        return successResponse(res, null, 'Xóa lĩnh vực phản ánh thành công');
    }
};

export default LinhVucPhanAnhController;