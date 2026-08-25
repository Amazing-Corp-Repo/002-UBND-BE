import ReceptionCounterService from "../services/reception-counter.service.js";
import { successResponse } from "../utils/response.util.js";

const ReceptionCounterController = {
  async getAll(req, res) {
    const data = await ReceptionCounterService.getAll();
    return successResponse(res, data, "Lấy danh sách quầy tiếp dân thành công");
  },

  async getById(req, res) {
    const data = await ReceptionCounterService.getById(req.validatedParams.id);
    return successResponse(res, data, "Lấy chi tiết quầy tiếp dân thành công");
  },

  async update(req, res) {
    const data = await ReceptionCounterService.update(
      req.validatedParams.id,
      req.body,
      req.payload.userId
    );
    return successResponse(res, data, "Cập nhật quầy tiếp dân thành công");
  },
};

export default ReceptionCounterController;
