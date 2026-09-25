import express from "express";
import VideoUploadController from "../controllers/video-upload.controller.js";
import { videoChunkUpload } from "../middlewares/video-chunk-upload.middleware.js";
import {
  createApiRateLimiter,
  toPositiveInteger,
} from "../middlewares/api-rate-limit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import {
  VideoUploadParams,
  VideoUploadRequest,
} from "../validators/video-upload.validator.js";
import env from "../config/environment.config.js";

const DEFAULT_UPLOAD_RATE_LIMIT = 240;

const uploadChunkLimiter = createApiRateLimiter({
  windowMs: toPositiveInteger(env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
  limit: toPositiveInteger(
    env.RATE_LIMIT_UPLOAD_VIDEO_MAX,
    DEFAULT_UPLOAD_RATE_LIMIT
  ),
  message: "Bạn đã tải lên quá nhiều phần video, vui lòng thử lại sau",
});

const videoUploadRouter = express.Router();

videoUploadRouter.post(
  "/upload",
  uploadChunkLimiter,
  videoChunkUpload,
  validate(VideoUploadRequest),
  VideoUploadController.uploadVideo
);

videoUploadRouter.get(
  "/:idVideo",
  validateParams(VideoUploadParams),
  VideoUploadController.getVideoUpload
);

export default videoUploadRouter;
