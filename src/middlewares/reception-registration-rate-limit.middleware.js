import rateLimit from "express-rate-limit";
import { errorResponse } from "../utils/response.util.js";

export const RECEPTION_REGISTRATION_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 30,
};

export const RECEPTION_LOOKUP_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 60,
};

export const createReceptionRegistrationRateLimiter = () =>
  rateLimit({
    ...RECEPTION_REGISTRATION_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      errorResponse(
        res,
        { message: "Bạn đã gửi quá nhiều yêu cầu đăng ký, vui lòng thử lại sau" },
        429
      ),
  });

export const createReceptionLookupRateLimiter = () =>
  rateLimit({
    ...RECEPTION_LOOKUP_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      errorResponse(
        res,
        { message: "Bạn đã tra cứu quá nhiều lần, vui lòng thử lại sau" },
        429
      ),
  });

const receptionRegistrationRateLimiter =
  createReceptionRegistrationRateLimiter();

export const receptionLookupRateLimiter =
  createReceptionLookupRateLimiter();

export default receptionRegistrationRateLimiter;
