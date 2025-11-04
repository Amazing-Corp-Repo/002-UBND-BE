import LichTiepDanService from "../services/lich-tiep-dan.service.js";
import { successResponse } from "../utils/response.util.js";

const LichTiepDanController = {
    async importLichTiepDan(req, res) {
        const file = req.files;
        const data = await LichTiepDanService.handleImport(file);
        return successResponse(res, data, "Import lịch tiếp dân thành công");
    },

    async getLichTiepDan(req, res) {
        const filters = req.query;
        const data = await LichTiepDanService.getLichTiepDan(filters);
        return successResponse(res, data, "Lấy danh sách lịch tiếp dân thành công");
    },

    async deleteLichTiepDan(req, res) {
        const { id } = req.params;
        await LichTiepDanService.deleteLichTiepDan(id);
        return successResponse(res, null, "Xoá lịch tiếp dân thành công");
    }
};

export default LichTiepDanController;