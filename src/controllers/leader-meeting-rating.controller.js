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
};

export default LeaderMeetingRatingController;
