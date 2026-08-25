import express from "express";
import ReceptionCounterAssignmentController from "../controllers/reception-counter-assignment.controller.js";
import { PERMISSION } from "../constants/permission.constant.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import {
  ReceptionShiftParams,
  ReplaceReceptionCounterAssignmentsRequest,
} from "../validators/reception-counter-assignment.validator.js";

const router = express.Router();

router.put(
  "/:shiftId/counter-assignments",
  authenticate,
  authorize([PERMISSION.LTD_UPDATE]),
  validateParams(ReceptionShiftParams),
  validate(ReplaceReceptionCounterAssignmentsRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, { tableName: "phan_cong_quay_tiep_dan" }),
  ReceptionCounterAssignmentController.replaceForShift
);

export default router;
