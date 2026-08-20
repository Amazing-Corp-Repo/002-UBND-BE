import express from "express";
import LeaderMeetingRatingController from "../controllers/leader-meeting-rating.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateLeaderMeetingRatingRequest,
  GetLeaderMeetingRatingsQuery,
  GetLeaderMeetingRatingStatisticsQuery,
} from "../validators/leader-meeting-rating.validator.js";
import leaderMeetingRatingRateLimiter from "../middlewares/leader-meeting-rating-rate-limit.middleware.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";
import validateQuery from "../middlewares/validate-query.middleware.js";

const leaderMeetingRatingRouter = express.Router();

// Route tĩnh phải đứng trước /:id khi bổ sung API chi tiết.
leaderMeetingRatingRouter.get(
  "/configuration",
  LeaderMeetingRatingController.getConfiguration
);

leaderMeetingRatingRouter.get(
  "/",
  authenticate,
  authorize([PERMISSION.LMRT_GET_ALL]),
  validateQuery(GetLeaderMeetingRatingsQuery),
  LeaderMeetingRatingController.getAll
);

leaderMeetingRatingRouter.get(
  "/statistics",
  authenticate,
  authorize([PERMISSION.LMRT_GET_STATS]),
  validateQuery(GetLeaderMeetingRatingStatisticsQuery),
  LeaderMeetingRatingController.getStatistics
);

leaderMeetingRatingRouter.post(
  "/",
  leaderMeetingRatingRateLimiter,
  validate(CreateLeaderMeetingRatingRequest),
  receptionAudit(AUDIT_LOGS.CREATE, { tableName: "danh_gia_gap_lanh_dao" }),
  LeaderMeetingRatingController.create
);

export default leaderMeetingRatingRouter;
