import express from "express";
import LeaderMeetingScheduleController from "../controllers/leader-meeting-schedule.controller.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import {
  GetLeaderMeetingScheduleManagementQuery,
  GetLeaderMeetingSchedulesQuery,
} from "../validators/leader-meeting-schedule.validator.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";

const leaderMeetingScheduleRouter = express.Router();

leaderMeetingScheduleRouter.get(
  "/management",
  authenticate,
  authorize([PERMISSION.LMS_GET_ALL]),
  validateQuery(GetLeaderMeetingScheduleManagementQuery),
  LeaderMeetingScheduleController.getManagement
);

leaderMeetingScheduleRouter.get(
  "/",
  validateQuery(GetLeaderMeetingSchedulesQuery),
  LeaderMeetingScheduleController.getAvailable
);

export default leaderMeetingScheduleRouter;
