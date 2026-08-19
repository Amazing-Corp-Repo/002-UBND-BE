import express from "express";
import ReceptionCounterController from "../controllers/reception-counter.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import {
  ReceptionCounterParams,
  UpdateReceptionCounterRequest,
} from "../validators/reception-counter.validator.js";
import validate from "../middlewares/validate.middleware.js";

const receptionCounterRouter = express.Router();

receptionCounterRouter.get(
  "/",
  authenticate,
  authorize([PERMISSION.LTD_GET_ALL]),
  receptionAudit(AUDIT_LOGS.READ, { tableName: "quay_tiep_dan" }),
  ReceptionCounterController.getAll
);

receptionCounterRouter.get(
  "/:id",
  authenticate,
  authorize([PERMISSION.LTD_GET_ALL]),
  validateParams(ReceptionCounterParams),
  receptionAudit(AUDIT_LOGS.READ, { tableName: "quay_tiep_dan" }),
  ReceptionCounterController.getById
);

receptionCounterRouter.patch(
  "/:id",
  authenticate,
  authorize([PERMISSION.LTD_UPDATE]),
  validateParams(ReceptionCounterParams),
  validate(UpdateReceptionCounterRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, { tableName: "quay_tiep_dan" }),
  ReceptionCounterController.update
);

export default receptionCounterRouter;
