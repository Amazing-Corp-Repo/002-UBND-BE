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
};

export default LeaderMeetingRatingController;
