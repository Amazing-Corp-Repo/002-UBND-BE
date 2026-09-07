import { createApiRateLimiter } from "./api-rate-limit.middleware.js";

export const RECEPTION_REGISTRATION_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 30,
};

export const RECEPTION_LOOKUP_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 60,
};

export const RECEPTION_RATING_LOOKUP_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 60,
};

export const createReceptionRegistrationRateLimiter = () =>
  createApiRateLimiter({
    ...RECEPTION_REGISTRATION_RATE_LIMIT,
    message: "Bạn đã gửi quá nhiều yêu cầu đăng ký, vui lòng thử lại sau",
  });

export const createReceptionLookupRateLimiter = () =>
  createApiRateLimiter({
    ...RECEPTION_LOOKUP_RATE_LIMIT,
    message: "Bạn đã tra cứu quá nhiều lần, vui lòng thử lại sau",
  });

export const createReceptionRatingLookupRateLimiter = () =>
  createApiRateLimiter({
    ...RECEPTION_RATING_LOOKUP_RATE_LIMIT,
    message: "Bạn đã tra cứu mã đánh giá quá nhiều lần, vui lòng thử lại sau",
  });

const receptionRegistrationRateLimiter =
  createReceptionRegistrationRateLimiter();

export const receptionLookupRateLimiter =
  createReceptionLookupRateLimiter();

export const receptionRatingLookupRateLimiter =
  createReceptionRatingLookupRateLimiter();

export default receptionRegistrationRateLimiter;
