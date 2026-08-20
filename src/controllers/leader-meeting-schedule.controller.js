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
};

export default LeaderMeetingScheduleController;
