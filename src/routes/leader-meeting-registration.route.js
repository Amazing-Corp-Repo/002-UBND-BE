import express from "express";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import LeaderMeetingRegistrationController from "../controllers/leader-meeting-registration.controller.js";
import { leaderMeetingRegistrationUpload } from "../middlewares/leader-meeting-upload.middleware.js";
import leaderMeetingRegistrationRateLimiter from "../middlewares/leader-meeting-rate-limit.middleware.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { CreateLeaderMeetingRegistrationRequest } from "../validators/leader-meeting-registration.validator.js";

const leaderMeetingRegistrationRouter = express.Router();

leaderMeetingRegistrationRouter.post(
  "/",
  leaderMeetingRegistrationRateLimiter,
  leaderMeetingRegistrationUpload,
  validate(CreateLeaderMeetingRegistrationRequest),
  receptionAudit(AUDIT_LOGS.CREATE, {
    tableName: "dang_ky_gap_lanh_dao",
    sensitiveFields: ["phoneNumber", "citizenId"],
  }),
  LeaderMeetingRegistrationController.create
);

export default leaderMeetingRegistrationRouter;
