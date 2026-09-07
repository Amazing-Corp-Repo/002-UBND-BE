import { createApiRateLimiter } from "./api-rate-limit.middleware.js";

export const LEADER_MEETING_RATING_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 20,
};

export const createLeaderMeetingRatingRateLimiter = () =>
  createApiRateLimiter({
    ...LEADER_MEETING_RATING_RATE_LIMIT,
    message: "Bạn đã gửi quá nhiều yêu cầu đánh giá, vui lòng thử lại sau",
  });

export default createLeaderMeetingRatingRateLimiter();
