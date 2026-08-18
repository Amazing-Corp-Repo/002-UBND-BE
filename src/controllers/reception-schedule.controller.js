import ReceptionScheduleService from "../services/reception-schedule.service.js";
import { successResponse } from "../utils/response.util.js";

const ReceptionScheduleController = {
  async getAvailable(req, res) {
    const data = await ReceptionScheduleService.getAvailableSchedules(
      req.validatedQuery
    );
    return successResponse(res, data, "Lấy lịch tiếp dân khả dụng thành công");
  },

  async updateSlotCapacity(req, res) {
    const { scheduleId, slotId } = req.params;
    const data = await ReceptionScheduleService.updateSlotCapacity(
      scheduleId,
      slotId,
      req.body.capacity,
      req.payload.userId
    );
    return successResponse(res, data, "Cập nhật sức chứa quầy thành công");
  },
};

export default ReceptionScheduleController;
