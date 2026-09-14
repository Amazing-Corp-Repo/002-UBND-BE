import express from "express";
import ReceptionScheduleController from "../controllers/reception-schedule.controller.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import { GetReceptionSchedulesQuery } from "../validators/reception-schedule.validator.js";

const receptionScheduleRouter = express.Router();

receptionScheduleRouter.get(
  "/",
  validateQuery(GetReceptionSchedulesQuery),
  ReceptionScheduleController.getAvailable
);

export default receptionScheduleRouter;
