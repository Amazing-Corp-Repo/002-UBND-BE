import { createApiRateLimiter } from "./api-rate-limit.middleware.js";

export const RECEPTION_RATING_SUBMISSION_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 20,
};

export const createReceptionRatingSubmissionRateLimiter = () =>
  createApiRateLimiter({
    ...RECEPTION_RATING_SUBMISSION_RATE_LIMIT,
    message: "Bạn đã gửi quá nhiều yêu cầu đánh giá, vui lòng thử lại sau",
  });

const receptionRatingSubmissionRateLimiter =
  createReceptionRatingSubmissionRateLimiter();

export default receptionRatingSubmissionRateLimiter;
