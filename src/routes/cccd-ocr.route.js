import express from "express";
import CccdOcrController from "../controllers/cccd-ocr.controller.js";
import { cccdOcrUpload } from "../middlewares/cccd-ocr-upload.middleware.js";
import { createLeaderMeetingRegistrationRateLimiter } from "../middlewares/leader-meeting-rate-limit.middleware.js";

const cccdOcrRouter = express.Router();
cccdOcrRouter.post("/cccd", createLeaderMeetingRegistrationRateLimiter(), cccdOcrUpload, CccdOcrController.recognize);
export default cccdOcrRouter;
