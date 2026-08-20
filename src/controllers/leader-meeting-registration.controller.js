import LeaderMeetingRegistrationService from "../services/leader-meeting-registration.service.js";
import { successResponse } from "../utils/response.util.js";

const LeaderMeetingRegistrationController = {
  async create(req, res) {
    const data = await LeaderMeetingRegistrationService.create(
      req.body,
      req.files
    );
    return successResponse(
      res,
      data,
      "Đăng ký gặp lãnh đạo thành công"
    );
  },

  async lookup(req, res) {
    const data = await LeaderMeetingRegistrationService.lookup(req.body);
    return successResponse(
      res,
      data,
      "Tra cứu đăng ký gặp lãnh đạo thành công"
    );
  },
};

export default LeaderMeetingRegistrationController;
