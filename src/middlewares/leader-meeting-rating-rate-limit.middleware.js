import rateLimit from "express-rate-limit";
import { errorResponse } from "../utils/response.util.js";

export const LEADER_MEETING_RATING_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 20,
};

export const createLeaderMeetingRatingRateLimiter = () =>
  rateLimit({
    ...LEADER_MEETING_RATING_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      errorResponse(
        res,
        { message: "Bạn đã gửi quá nhiều yêu cầu đánh giá, vui lòng thử lại sau" },
        429
      ),
  });

export default createLeaderMeetingRatingRateLimiter();
