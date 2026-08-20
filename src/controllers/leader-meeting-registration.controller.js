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

  async getManagement(req, res) {
    const result =
      await LeaderMeetingRegistrationService.getManagementRegistrations(
        req.validatedQuery,
        req.payload
      );
    return successResponse(
      res,
      result.data,
      "Lấy danh sách đăng ký gặp lãnh đạo thành công",
      result.pagination
    );
  },

  async getManagementDetail(req, res) {
    const data = await LeaderMeetingRegistrationService.getManagementDetail(
      req.validatedParams.id,
      req.payload
    );
    return successResponse(
      res,
      data,
      "Lấy chi tiết đăng ký gặp lãnh đạo thành công"
    );
  },

  async approve(req, res) {
    const data = await LeaderMeetingRegistrationService.approve(
      req.validatedParams.id,
      req.payload
    );
    return successResponse(
      res,
      data,
      "Phê duyệt đăng ký gặp lãnh đạo thành công"
    );
  },

  async reject(req, res) {
    const data = await LeaderMeetingRegistrationService.reject(
      req.validatedParams.id,
      req.body,
      req.payload
    );
    return successResponse(
      res,
      data,
      "Từ chối đăng ký gặp lãnh đạo thành công"
    );
  },
};

export default LeaderMeetingRegistrationController;
