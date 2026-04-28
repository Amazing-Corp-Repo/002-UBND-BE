import express from "express";
import VideoUploadController from "../controllers/video-upload.controller.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { VideoUploadRequest } from "../validators/video-upload.validator.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";
import rateLimit from "express-rate-limit";
import { errorResponse } from "../utils/response.util.js";
import env from "../config/environment.config.js";

const RATE_LIMIT_WINDOW_MS = parseInt(env.RATE_LIMIT_WINDOW_MS);
const REATE_LIMIT_FOR_UPLOAD_VIDEO_MAX = parseInt(env.REATE_LIMIT_FOR_UPLOAD_VIDEO_MAX);

const uploadChunkLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: REATE_LIMIT_FOR_UPLOAD_VIDEO_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    return errorResponse(
      res,
      { message: "Too many upload requests, please try again later." },
      429
    );
  },
});

const videoUploadRouter = express.Router();

videoUploadRouter.post(
  "/upload",
  uploadChunkLimiter,
  createUploader({
    type: UPLOAD_TYPE.PHAN_ANH,
    fieldName: "file",
    maxCount: 1,
    maxSizeMB: 300,
    allowed_types: ["video/mp4", "video/mov", "video/avi", "video/mkv"],
    basePathSegments: ["src", "private", "uploads", "videos"],
    isPublic: false,
  }),
  validate(VideoUploadRequest),
  VideoUploadController.uploadVideo
);

videoUploadRouter.get("/:idVideo", VideoUploadController.getVideoUpload);

export default videoUploadRouter;
