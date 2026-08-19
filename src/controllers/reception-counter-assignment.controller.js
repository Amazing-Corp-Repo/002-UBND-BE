import ReceptionCounterAssignmentService from "../services/reception-counter-assignment.service.js";
import { successResponse } from "../utils/response.util.js";

const ReceptionCounterAssignmentController = {
  async getAll(req, res) {
    const data = await ReceptionCounterAssignmentService.getAll(req.validatedQuery);
    return successResponse(res, data, "Lấy danh sách phân công quầy thành công");
  },

  async getById(req, res) {
    const data = await ReceptionCounterAssignmentService.getById(req.validatedParams.id);
    return successResponse(res, data, "Lấy chi tiết phân công quầy thành công");
  },

  async replaceForShift(req, res) {
    const data = await ReceptionCounterAssignmentService.replaceForShift(
      req.validatedParams.shiftId,
      req.body.assignments,
      req.payload.userId
    );
    return successResponse(res, data, "Cập nhật phân công quầy theo ca thành công");
  },
};

export default ReceptionCounterAssignmentController;
