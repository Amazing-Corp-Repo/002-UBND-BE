import LinhVucService from "../services/linh-vuc.service.js";
import { successResponse } from "../utils/response.util.js";

const LinhVucController = {
    async getAll(req, res) {
        const { isActive, search } = req.query;
        const searchTerm =
            typeof search === "string" && search.trim() !== ""
                ? search.trim()
                : undefined;
        const linhVucs = await LinhVucService.getAll(isActive, searchTerm);
        return successResponse(res, linhVucs, "Lấy danh sách lĩnh vực thành công");
    },

    async create(req, res) {
        const { tenLinhVuc, moTa } = req.body;
        const currentUser = req.payload.userId;
        const newLinhVuc = await LinhVucService.create(tenLinhVuc, moTa, currentUser);
        return successResponse(res, newLinhVuc, "Tạo lĩnh vực thành công");
    },

    async update(req, res) {
        const { id } = req.params;
        const { tenLinhVuc, moTa } = req.body;
        const currentUser = req.payload.userId;
        const updatedLinhVuc = await LinhVucService.update(id, tenLinhVuc, moTa, currentUser);
        return successResponse(res, updatedLinhVuc, "Cập nhật lĩnh vực thành công");
    },

    async updateStatus(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.payload.userId;
        const updatedLinhVuc = await LinhVucService.updateStatus(id, isActive, currentUser);
        return successResponse(res, updatedLinhVuc, "Cập nhật trạng thái lĩnh vực thành công");
    },

    async delete(req, res) {
        const { id } = req.params;
        const currentUser = req.payload.userId;
        await LinhVucService.delete(id, currentUser);
        return successResponse(res, null, "Xóa lĩnh vực thành công");
    },
};

export default LinhVucController;