import { successResponse } from '../utils/response.util.js';
import ThuTucService from '../services/thu-tuc.service.js';

const ThuTucController = {
    async getThuTucById(req, res) {
        const { id } = req.params; // Lấy ID thủ tục từ URL params
        const procedure = await ThuTucService.getThuTucById(id); // Gọi service để lấy dữ liệu
        return successResponse(res, procedure, 'Lấy thông tin thủ tục thành công'); // Trả về phản hồi thành công
    },

    async getAll(req, res) {
        const { page = 1, size = 10, isActive, idLinhVuc, search } = req.query;
        const result = await ThuTucService.getAll(parseInt(page), parseInt(size), isActive, idLinhVuc, search);
        return successResponse(res, result.data, "Lấy danh sách thủ tục thành công", result.pagination);
    },

    async getMauDonByThuTucId(req, res) {
        const { id } = req.params;
        const result = await ThuTucService.getMauDonByThuTucId(id);
        return successResponse(res, result, "Lấy danh sách mẫu đơn thành công");
    },

    async createThuTuc(req, res) {
        const { idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien, truongHopThuTuc } = req.body;
        const currentUser = req.payload.userId;
        const newThuTuc = await ThuTucService.createThuTuc(idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien, truongHopThuTuc, currentUser);
        return successResponse(res, newThuTuc, "Tạo thủ tục thành công");
    },

    async deleteThuTuc(req, res) {
        const { id } = req.params;
        const currentUser = req.payload.userId;
        await ThuTucService.deleteThuTuc(id, currentUser);
        return successResponse(res, null, "Xóa thủ tục hành chính thành công");
    },

    async updateThuTuc(req, res) {
        const { id } = req.params;
        const { idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien, truongHopThuTuc } = req.body;
        const currentUser = req.payload.userId;
        const updatedThuTuc = await ThuTucService.updateThuTuc(id, idCoSoDichVuCong, tenThuTuc, maThuTuc, doiTuongThucHien, yeuCauDieuKienChung, soQuyetDinh, danhSachLinhVucIds, danhSachMauDon, cachThuThucHien, trinhTuThucHien, truongHopThuTuc, currentUser);
        return successResponse(res, updatedThuTuc, "Cập nhật thủ tục thành công");
    },

    async getAllForMobile(req, res) {
        const { idLinhVuc } = req.query;
        const result = await ThuTucService.getAllForMobile(idLinhVuc);
        return successResponse(res, result, "Lấy danh sách thủ tục cho mobile thành công");
    },

    async updateThuTucStatus(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.payload.userId;
        const updatedThuTuc = await ThuTucService.updateThuTucStatus(id, isActive, currentUser);
        return successResponse(res, updatedThuTuc, "Cập nhật trạng thái thủ tục thành công");
    },

    async getThanhPhanByThuTucId(req, res) {
        const { id } = req.params;
        const result = await ThuTucService.getThanhPhanByThuTucId(id);
        return successResponse(res, result, "Lấy thành phần thủ tục thành công");
    },
};

export default ThuTucController;
