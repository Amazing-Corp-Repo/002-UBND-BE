import { createApiRateLimiter } from "./api-rate-limit.middleware.js";

export const PHAN_ANH_RATING_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 20,
};

export const createPhanAnhRatingRateLimiter = () =>
  createApiRateLimiter({
    ...PHAN_ANH_RATING_RATE_LIMIT,
    message: "Bạn đã gửi quá nhiều yêu cầu đánh giá, vui lòng thử lại sau",
  });

export default createPhanAnhRatingRateLimiter();
