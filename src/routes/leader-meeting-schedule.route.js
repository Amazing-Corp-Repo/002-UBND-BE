import express from "express";
import LeaderMeetingScheduleController from "../controllers/leader-meeting-schedule.controller.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import {
  GetLeaderMeetingScheduleManagementQuery,
  GetLeaderMeetingSchedulesQuery,
  LeaderMeetingScheduleIdParams,
  CreateLeaderMeetingScheduleRequest,
  UpdateLeaderMeetingScheduleRequest,
  UpdateLeaderMeetingScheduleStatusRequest,
} from "../validators/leader-meeting-schedule.validator.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";

const leaderMeetingScheduleRouter = express.Router();

leaderMeetingScheduleRouter.get(
  "/management",
  authenticate,
  authorize([PERMISSION.LMS_GET_ALL]),
  validateQuery(GetLeaderMeetingScheduleManagementQuery),
  LeaderMeetingScheduleController.getManagement
);

leaderMeetingScheduleRouter.post(
  "/management",
  authenticate,
  authorize([PERMISSION.LMS_CREATE]),
  validate(CreateLeaderMeetingScheduleRequest),
  receptionAudit(AUDIT_LOGS.CREATE, { tableName: "lich_gap_lanh_dao" }),
  LeaderMeetingScheduleController.createManagement
);

leaderMeetingScheduleRouter.get(
  "/management/:id",
  authenticate,
  authorize([PERMISSION.LMS_GET_DETAIL]),
  validateParams(LeaderMeetingScheduleIdParams),
  LeaderMeetingScheduleController.getManagementDetail
);

leaderMeetingScheduleRouter.put(
  "/management/:id",
  authenticate,
  authorize([PERMISSION.LMS_UPDATE]),
  validateParams(LeaderMeetingScheduleIdParams),
  validate(UpdateLeaderMeetingScheduleRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, { tableName: "lich_gap_lanh_dao" }),
  LeaderMeetingScheduleController.updateManagement
);

leaderMeetingScheduleRouter.put(
  "/management/:id/status",
  authenticate,
  authorize([PERMISSION.LMS_UPDATE_STATUS]),
  validateParams(LeaderMeetingScheduleIdParams),
  validate(UpdateLeaderMeetingScheduleStatusRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, { tableName: "lich_gap_lanh_dao" }),
  LeaderMeetingScheduleController.updateManagementStatus
);

leaderMeetingScheduleRouter.get(
  "/",
  validateQuery(GetLeaderMeetingSchedulesQuery),
  LeaderMeetingScheduleController.getAvailable
);

export default leaderMeetingScheduleRouter;
