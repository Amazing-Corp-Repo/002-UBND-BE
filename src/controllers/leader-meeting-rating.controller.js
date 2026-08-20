import LeaderMeetingRatingService from "../services/leader-meeting-rating.service.js";
import { successResponse } from "../utils/response.util.js";

const LeaderMeetingRatingController = {
  getConfiguration(_req, res) {
    return successResponse(
      res,
      LeaderMeetingRatingService.getConfiguration(),
      "Lấy cấu hình đánh giá gặp lãnh đạo thành công"
    );
  },

  async create(req, res) {
    const data = await LeaderMeetingRatingService.create(req.body);
    return successResponse(res, data, "Gửi đánh giá gặp lãnh đạo thành công");
  },

  async getAll(req, res) {
    const result = await LeaderMeetingRatingService.getAll(
      req.validatedQuery,
      req.payload
    );
    return successResponse(
      res,
      result.data,
      "Lấy danh sách đánh giá gặp lãnh đạo thành công",
      result.pagination
    );
  },

  async getStatistics(req, res) {
    const data = await LeaderMeetingRatingService.getStatistics(
      req.validatedQuery,
      req.payload
    );
    return successResponse(
      res,
      data,
      "Lấy thống kê đánh giá gặp lãnh đạo thành công"
    );
  },
};

export default LeaderMeetingRatingController;
