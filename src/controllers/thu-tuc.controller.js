import { successResponse } from '../utils/response.util.js';
import ThuTucService from '../services/thu-tuc.service.js';

const ThuTucController = {
    async getThuTucById(req, res) {
        const { id } = req.params; // Lấy ID thủ tục từ URL params
        const procedure = await ThuTucService.getThuTucById(id); // Gọi service để lấy dữ liệu
        return successResponse(res, procedure, 'Lấy thông tin thủ tục thành công'); // Trả về phản hồi thành công
    },

    async getAll(req, res) {
        const { page = 1, size = 10, is_removed, id_linh_vuc, search } = req.query;
        const result = await ThuTucService.getAll(parseInt(page), parseInt(size), is_removed, id_linh_vuc, search);
        return successResponse(res, result.data, "Lấy danh sách thủ tục thành công", result.pagination);
    },

    async getMauDonByThuTucId(req, res) {
        const { id } = req.params;
        const result = await ThuTucService.getMauDonByThuTucId(id);
        return successResponse(res, result, "Lấy danh sách mẫu đơn thành công");
    },

    async createThuTuc(req, res) {
        const { idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien } = req.body;
        const newThuTuc = await ThuTucService.createThuTuc(idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien);
        return successResponse(res, newThuTuc, "Tạo thủ tục thành công");
    },

    async hardDeleteThuTuc(req, res) {
        const { id } = req.params;
        await ThuTucService.hardDeleteThuTuc(id);
        return successResponse(res, null, "Xóa thủ tục hành chính thành công");
    },

    async updateThuTuc(req, res) {
        const { id } = req.params;
        const { idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien, isRemoved } = req.body;
        const updatedThuTuc = await ThuTucService.updateThuTuc(id, idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, isRemoved, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien);
        return successResponse(res, updatedThuTuc, "Cập nhật thủ tục thành công");
    },

    async getAllForMobile(req, res) {
        const { id_linh_vuc } = req.query;
        const result = await ThuTucService.getAllForMobile(id_linh_vuc);
        return successResponse(res, result, "Lấy danh sách thủ tục cho mobile thành công");
    }
};

export default ThuTucController;
