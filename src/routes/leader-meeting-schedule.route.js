import express from "express";
import LeaderMeetingScheduleController from "../controllers/leader-meeting-schedule.controller.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import { GetLeaderMeetingSchedulesQuery } from "../validators/leader-meeting-schedule.validator.js";

const leaderMeetingScheduleRouter = express.Router();

leaderMeetingScheduleRouter.get(
  "/",
  validateQuery(GetLeaderMeetingSchedulesQuery),
  LeaderMeetingScheduleController.getAvailable
);

export default leaderMeetingScheduleRouter;
