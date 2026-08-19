import express from "express";
import ReceptionScheduleController from "../controllers/reception-schedule.controller.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import {
  GetReceptionSchedulesQuery,
  ReceptionScheduleSlotParams,
  UpdateReceptionSlotCapacityRequest,
} from "../validators/reception-schedule.validator.js";
import validate from "../middlewares/validate.middleware.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";

const receptionScheduleRouter = express.Router();

receptionScheduleRouter.get(
  "/",
  validateQuery(GetReceptionSchedulesQuery),
  ReceptionScheduleController.getAvailable
);

receptionScheduleRouter.patch(
  "/:scheduleId/slots/:slotId/capacity",
  authenticate,
  authorize([PERMISSION.LTD_UPDATE]),
  validateParams(ReceptionScheduleSlotParams),
  validate(UpdateReceptionSlotCapacityRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, { tableName: "khung_gio_tiep_dan" }),
  ReceptionScheduleController.updateSlotCapacity
);

export default receptionScheduleRouter;
