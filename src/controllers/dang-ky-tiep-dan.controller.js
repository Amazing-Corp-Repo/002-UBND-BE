import DangKyTiepDanService from "../services/dang-ky-tiep-dan.service.js";
import { successResponse } from "../utils/response.util.js";

const DangKyTiepDanController = {
  async create(req, res) {
    const data = await DangKyTiepDanService.createCounterReception(req.body);
    return successResponse(res, data, "Đăng ký lịch tiếp dân thành công");
  },
};

export default DangKyTiepDanController;
