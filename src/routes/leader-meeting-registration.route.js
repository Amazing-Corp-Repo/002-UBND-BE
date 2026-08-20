import express from "express";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import LeaderMeetingRegistrationController from "../controllers/leader-meeting-registration.controller.js";
import { leaderMeetingRegistrationUpload } from "../middlewares/leader-meeting-upload.middleware.js";
import leaderMeetingRegistrationRateLimiter from "../middlewares/leader-meeting-rate-limit.middleware.js";
import { leaderMeetingLookupRateLimiter } from "../middlewares/leader-meeting-rate-limit.middleware.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateLeaderMeetingRegistrationRequest,
  LookupLeaderMeetingRegistrationRequest,
  GetLeaderMeetingRegistrationsQuery,
  LeaderMeetingRegistrationIdParams,
  RejectLeaderMeetingRegistrationRequest,
  ProcessLeaderMeetingRegistrationRequest,
  CompleteLeaderMeetingRegistrationRequest,
} from "../validators/leader-meeting-registration.validator.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";

const leaderMeetingRegistrationRouter = express.Router();

leaderMeetingRegistrationRouter.get(
  "/",
  authenticate,
  authorize([PERMISSION.LMR_GET_ALL]),
  validateQuery(GetLeaderMeetingRegistrationsQuery),
  LeaderMeetingRegistrationController.getManagement
);

leaderMeetingRegistrationRouter.get(
  "/:id",
  authenticate,
  authorize([PERMISSION.LMR_GET_DETAIL]),
  validateParams(LeaderMeetingRegistrationIdParams),
  LeaderMeetingRegistrationController.getManagementDetail
);

leaderMeetingRegistrationRouter.patch(
  "/:id/approve",
  authenticate,
  authorize([PERMISSION.LMR_APPROVE]),
  validateParams(LeaderMeetingRegistrationIdParams),
  receptionAudit(AUDIT_LOGS.UPDATE, {
    tableName: "dang_ky_gap_lanh_dao",
    sensitiveFields: ["phoneNumber", "citizenId"],
  }),
  LeaderMeetingRegistrationController.approve
);

leaderMeetingRegistrationRouter.patch(
  "/:id/reject",
  authenticate,
  authorize([PERMISSION.LMR_REJECT]),
  validateParams(LeaderMeetingRegistrationIdParams),
  validate(RejectLeaderMeetingRegistrationRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, {
    tableName: "dang_ky_gap_lanh_dao",
    sensitiveFields: ["phoneNumber", "citizenId"],
  }),
  LeaderMeetingRegistrationController.reject
);

leaderMeetingRegistrationRouter.patch(
  "/:id/process",
  authenticate,
  authorize([PERMISSION.LMR_PROCESS]),
  validateParams(LeaderMeetingRegistrationIdParams),
  validate(ProcessLeaderMeetingRegistrationRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, {
    tableName: "dang_ky_gap_lanh_dao",
    sensitiveFields: ["phoneNumber", "citizenId"],
  }),
  LeaderMeetingRegistrationController.process
);

leaderMeetingRegistrationRouter.patch(
  "/:id/complete",
  authenticate,
  authorize([PERMISSION.LMR_COMPLETE]),
  validateParams(LeaderMeetingRegistrationIdParams),
  validate(CompleteLeaderMeetingRegistrationRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, {
    tableName: "dang_ky_gap_lanh_dao",
    sensitiveFields: ["phoneNumber", "citizenId"],
  }),
  LeaderMeetingRegistrationController.complete
);

leaderMeetingRegistrationRouter.post(
  "/lookup",
  leaderMeetingLookupRateLimiter,
  validate(LookupLeaderMeetingRegistrationRequest),
  LeaderMeetingRegistrationController.lookup
);

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
