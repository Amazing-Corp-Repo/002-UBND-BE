import express from "express";
import ReceptionCounterAssignmentController from "../controllers/reception-counter-assignment.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import { GetReceptionCounterAssignmentsQuery } from "../validators/reception-counter-assignment.validator.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";

const router = express.Router();
router.get(
  "/",
  authenticate,
  authorize([PERMISSION.LTD_GET_ALL]),
  validateQuery(GetReceptionCounterAssignmentsQuery),
  receptionAudit(AUDIT_LOGS.READ, { tableName: "phan_cong_quay_tiep_dan" }),
  ReceptionCounterAssignmentController.getAll
);

export default router;
