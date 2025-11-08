import express from "express";
import VideoUploadController from "../controllers/video-upload.controller.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import AUDIT_LOGS from "../constants/audit-logs-action.constant.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { VideoUploadRequest } from "../validators/video-upload.validator.js";

const videoUploadRouter = express.Router();

videoUploadRouter.post(
    "/upload",
    createUploader({
        type: UPLOAD_TYPE.PHAN_ANH,
        fieldName: "file",
        maxCount: 1,
        maxSizeMB: 500,
        allowed_types: ["video/mp4", "video/mov", "video/avi", "video/mkv"],
        basePathSegments: ["src", "private", "uploads", "videos"],
        isPublic: false,
    }),
    validate(VideoUploadRequest),
    audit_logs(AUDIT_LOGS.CREATE, "video_uploads, video_upload_chunks"),
    VideoUploadController.uploadVideo
);

export default videoUploadRouter;