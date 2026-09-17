import ReceptionScheduleService from "../services/reception-schedule.service.js";
import { successResponse } from "../utils/response.util.js";

const ReceptionScheduleController = {
  async getAvailable(req, res) {
    const data = await ReceptionScheduleService.getAvailableSchedules(
      req.validatedQuery
    );
    return successResponse(res, data, "Lấy lịch tiếp dân khả dụng thành công");
  },
};

export default ReceptionScheduleController;
