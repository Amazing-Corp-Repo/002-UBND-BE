import ReceptionCounterService from "../services/reception-counter.service.js";
import { successResponse } from "../utils/response.util.js";

const ReceptionCounterController = {
  async getAll(req, res) {
    const data = await ReceptionCounterService.getAll();
    return successResponse(res, data, "Lấy danh sách quầy tiếp dân thành công");
  },
};

export default ReceptionCounterController;
