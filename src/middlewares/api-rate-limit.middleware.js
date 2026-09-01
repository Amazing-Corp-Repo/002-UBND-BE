import rateLimit from "express-rate-limit";
import env from "../config/environment.config.js";
import { errorResponse } from "../utils/response.util.js";

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_READ_LIMIT = 100;
const DEFAULT_WRITE_LIMIT = 30;

export const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const API_RATE_LIMIT = Object.freeze({
  windowMs: toPositiveInteger(env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS),
  readLimit: toPositiveInteger(env.RATE_LIMIT_MAX, DEFAULT_READ_LIMIT),
  writeLimit: toPositiveInteger(
    env.RATE_LIMIT_WRITE_MAX,
    DEFAULT_WRITE_LIMIT
  ),
});

const isVideoChunkUpload = (req) =>
  req.method === "POST" && req.path === "/video/upload";

const isSafeMethod = (method) =>
  method === "GET" || method === "HEAD" || method === "OPTIONS";

export const createApiRateLimiter = ({
  windowMs,
  limit,
  message,
  skip = () => false,
}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    handler: (_req, res) => errorResponse(res, { message }, 429),
  });

// Protects every business API from request floods. Video chunks use their own
// higher-capacity limiter because one video is intentionally sent in many parts.
export const apiRequestRateLimiter = createApiRateLimiter({
  windowMs: API_RATE_LIMIT.windowMs,
  limit: API_RATE_LIMIT.readLimit,
  skip: isVideoChunkUpload,
  message: "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau",
});

// Mutating requests receive an additional, stricter budget. This covers every
// POST/PUT/PATCH/DELETE route, including authenticated administration APIs.
export const apiMutationRateLimiter = createApiRateLimiter({
  windowMs: API_RATE_LIMIT.windowMs,
  limit: API_RATE_LIMIT.writeLimit,
  skip: (req) => isSafeMethod(req.method) || isVideoChunkUpload(req),
  message: "Bạn thao tác quá nhanh, vui lòng chờ một lúc rồi thử lại",
});
