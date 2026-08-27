import { createApiRateLimiter } from "./api-rate-limit.middleware.js";

export const LEADER_MEETING_REGISTRATION_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 30,
};

export const LEADER_MEETING_LOOKUP_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  limit: 60,
};

export const createLeaderMeetingRegistrationRateLimiter = () =>
  createApiRateLimiter({
    ...LEADER_MEETING_REGISTRATION_RATE_LIMIT,
    message: "Bạn đã gửi quá nhiều yêu cầu đăng ký, vui lòng thử lại sau",
  });

const leaderMeetingRegistrationRateLimiter =
  createLeaderMeetingRegistrationRateLimiter();

export const createLeaderMeetingLookupRateLimiter = () =>
  createApiRateLimiter({
    ...LEADER_MEETING_LOOKUP_RATE_LIMIT,
    message: "Bạn đã tra cứu quá nhiều lần, vui lòng thử lại sau",
  });

export const leaderMeetingLookupRateLimiter =
  createLeaderMeetingLookupRateLimiter();

export default leaderMeetingRegistrationRateLimiter;
