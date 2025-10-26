import ThuTucService from "../services/thu-tuc.service.js";
import { successResponse } from "../utils/response.util.js";

const ThuTucController = {
    /**
     * GET /api/thu-tuc/:id/mau-don
     * Lấy danh sách mẫu đơn theo id thủ tục
     */
    async getMauDonByThuTucId(req, res) {
        const { id } = req.params;
        const result = await ThuTucService.getMauDonByThuTucId(id);
        return successResponse(res, result, "Lấy danh sách mẫu đơn thành công");
    }
};

export default ThuTucController;
