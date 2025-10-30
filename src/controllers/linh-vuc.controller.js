import LinhVucService from "../services/linh-vuc.service.js";
import { successResponse } from "../utils/response.util.js";

const LinhVucController = {
    async getAll(req, res) {
        const { is_removed, search } = req.query;
        const searchTerm =
            typeof search === "string" && search.trim() !== ""
                ? search.trim()
                : undefined;
        const linhVucs = await LinhVucService.getAll(is_removed, searchTerm);
        return successResponse(res, linhVucs, "Lấy danh sách lĩnh vực thành công");
    },

    async create(req, res) {
        const { ten_linh_vuc, mo_ta } = req.body;
        const newLinhVuc = await LinhVucService.create(ten_linh_vuc, mo_ta);
        return successResponse(res, newLinhVuc, "Tạo lĩnh vực thành công");
    },

    async update(req, res) {
        const { id } = req.params;
        const { ten_linh_vuc, mo_ta, is_remove } = req.body;
        const nguoi_cap_nhap = req.payload.userId;
        const updatedLinhVuc = await LinhVucService.update(id, ten_linh_vuc, mo_ta, is_remove, nguoi_cap_nhap);
        return successResponse(res, updatedLinhVuc, "Cập nhật lĩnh vực thành công");
    },

    async hardDelete(req, res) {
        const { id } = req.params;
        await LinhVucService.hardDelete(id);
        return successResponse(res, null, "Xóa cứng lĩnh vực thành công");
    },
};

export default LinhVucController;