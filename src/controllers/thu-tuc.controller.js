import ThuTucService from "../services/thu-tuc.service.js";
import { successResponse } from "../utils/response.util.js";

const ThuTucController = {
  async search(req, res) {
    const { keyword, linhVucId } = req.query;
    const thuTucs = await ThuTucService.searchThuTuc({ keyword, linhVucId });
    return successResponse(res, thuTucs, "Tìm Kiếm thủ tục thành công");
  },
    async getMauDonByThuTucId(req, res) {
        const { id } = req.params;
        const result = await ThuTucService.getMauDonByThuTucId(id);
        return successResponse(res, result, "Lấy danh sách mẫu đơn thành công");
    }
};

export default ThuTucController;
