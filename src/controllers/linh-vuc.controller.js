import LinhVucService from "../services/linh-vuc.service.js";
import { successResponse } from "../utils/response.util.js";

const LinhVucController = {
    async getAll(req, res) {
        const { is_removed } = req.query;
        const linhVucs = await LinhVucService.getAll(is_removed);
        return successResponse(res, linhVucs, "Lấy danh sách lĩnh vực thành công");
    },
};

export default LinhVucController;