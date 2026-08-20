import LeaderMeetingScheduleService from "../services/leader-meeting-schedule.service.js";
import { successResponse } from "../utils/response.util.js";

const LeaderMeetingScheduleController = {
  async getAvailable(req, res) {
    const data = await LeaderMeetingScheduleService.getAvailableSchedules(
      req.validatedQuery
    );
    return successResponse(
      res,
      data,
      "Lấy lịch gặp lãnh đạo khả dụng thành công"
    );
  },

  async getManagement(req, res) {
    const result = await LeaderMeetingScheduleService.getManagementSchedules(
      req.validatedQuery,
      req.payload
    );
    return successResponse(
      res,
      result.data,
      "Lấy danh sách lịch gặp lãnh đạo thành công",
      result.pagination
    );
  },

  async getManagementDetail(req, res) {
    const data = await LeaderMeetingScheduleService.getManagementDetail(
      req.validatedParams.id,
      req.payload
    );
    return successResponse(
      res,
      data,
      "Lấy chi tiết lịch gặp lãnh đạo thành công"
    );
  },

  async createManagement(req, res) {
    const data = await LeaderMeetingScheduleService.createManagementSchedule(
      req.body,
      req.payload
    );
    return successResponse(res, data, "Tạo lịch gặp lãnh đạo thành công");
  },
};

export default LeaderMeetingScheduleController;
