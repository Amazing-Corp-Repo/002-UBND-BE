import rateLimit from "express-rate-limit";
import { errorResponse } from "../utils/response.util.js";

export const LEADER_MEETING_REGISTRATION_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 30,
};

export const LEADER_MEETING_LOOKUP_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 60,
};

export const createLeaderMeetingRegistrationRateLimiter = () =>
  rateLimit({
    ...LEADER_MEETING_REGISTRATION_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      errorResponse(
        res,
        { message: "Bạn đã gửi quá nhiều yêu cầu đăng ký, vui lòng thử lại sau" },
        429
      ),
  });

const leaderMeetingRegistrationRateLimiter =
  createLeaderMeetingRegistrationRateLimiter();

export const createLeaderMeetingLookupRateLimiter = () =>
  rateLimit({
    ...LEADER_MEETING_LOOKUP_RATE_LIMIT,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      errorResponse(
        res,
        { message: "Bạn đã tra cứu quá nhiều lần, vui lòng thử lại sau" },
        429
      ),
  });

export const leaderMeetingLookupRateLimiter =
  createLeaderMeetingLookupRateLimiter();

export default leaderMeetingRegistrationRateLimiter;
