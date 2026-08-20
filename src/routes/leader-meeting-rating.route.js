import express from "express";
import LeaderMeetingRatingController from "../controllers/leader-meeting-rating.controller.js";

const leaderMeetingRatingRouter = express.Router();

// Route tĩnh phải đứng trước /:id khi bổ sung API chi tiết.
leaderMeetingRatingRouter.get(
  "/configuration",
  LeaderMeetingRatingController.getConfiguration
);

export default leaderMeetingRatingRouter;
