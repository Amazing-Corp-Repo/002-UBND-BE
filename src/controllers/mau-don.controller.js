import MauDonService from "../services/mau-don.service.js";
import { successResponse } from "../utils/response.util.js";

const MauDonController = {
    /**
     * GET /api/thu-tuc/:id/mau-don
     * Lấy danh sách mẫu đơn theo id thủ tục
     */
    async getMauDonByThuTucId(req, res) {
        const { id } = req.params;
        const result = await MauDonService.getMauDonByThuTucId(id);
        return successResponse(res, result, "Lấy danh sách mẫu đơn thành công");
    }
};

export default MauDonController;

