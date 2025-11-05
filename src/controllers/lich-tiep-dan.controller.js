import LichTiepDanService from "../services/lich-tiep-dan.service.js";
import { successResponse } from "../utils/response.util.js";

const LichTiepDanController = {
    async importLichTiepDan(req, res) {
        const file = req.files;
        const currentUser = req.payload.userId;
        const data = await LichTiepDanService.handleImport(file, currentUser);
        return successResponse(res, data, "Import lịch tiếp dân thành công");
    },

    async getLichTiepDan(req, res) {
        const filters = req.query;
        const data = await LichTiepDanService.getLichTiepDan(filters);
        return successResponse(res, data, "Lấy danh sách lịch tiếp dân thành công");
    },

    async deleteLichTiepDan(req, res) {
        const { id } = req.params;
        const currentUser = req.payload.userId;
        await LichTiepDanService.deleteLichTiepDan(id, currentUser);
        return successResponse(res, null, "Xoá lịch tiếp dân thành công");
    },

    async updateStatusLichTiepDan(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.payload.userId;
        const data = await LichTiepDanService.updateLichTiepDan(id, isActive, currentUser);
        return successResponse(res, data, "Cập nhật lịch tiếp dân thành công");
    },
};

export default LichTiepDanController;