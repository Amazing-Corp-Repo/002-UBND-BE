import ThuTucService from "../services/thu-tuc.service.js";
import { successResponse } from "../utils/response.util.js";

const ThuTucController = {
  async search(req, res) {
    const { keyword, linhVucId } = req.query;
    const thuTucs = await ThuTucService.searchThuTuc({ keyword, linhVucId });
    return successResponse(res, thuTucs, "Tim kiem thu tuc thanh cong");
  },
};

export default ThuTucController;



v
v
v
v
v