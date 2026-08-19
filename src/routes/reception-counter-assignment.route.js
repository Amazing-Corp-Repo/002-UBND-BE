import express from "express";
import ReceptionCounterAssignmentController from "../controllers/reception-counter-assignment.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import {
  GetReceptionCounterAssignmentsQuery,
  ReceptionCounterAssignmentParams,
  UpdateReceptionCounterAssignmentRequest,
} from "../validators/reception-counter-assignment.validator.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import validate from "../middlewares/validate.middleware.js";

const router = express.Router();
router.get(
  "/",
  authenticate,
  authorize([PERMISSION.LTD_GET_ALL]),
  validateQuery(GetReceptionCounterAssignmentsQuery),
  receptionAudit(AUDIT_LOGS.READ, { tableName: "phan_cong_quay_tiep_dan" }),
  ReceptionCounterAssignmentController.getAll
);

router.get(
  "/:id",
  authenticate,
  authorize([PERMISSION.LTD_GET_ALL]),
  validateParams(ReceptionCounterAssignmentParams),
  receptionAudit(AUDIT_LOGS.READ, { tableName: "phan_cong_quay_tiep_dan" }),
  ReceptionCounterAssignmentController.getById
);

router.patch(
  "/:id",
  authenticate,
  authorize([PERMISSION.LTD_UPDATE]),
  validateParams(ReceptionCounterAssignmentParams),
  validate(UpdateReceptionCounterAssignmentRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, { tableName: "phan_cong_quay_tiep_dan" }),
  ReceptionCounterAssignmentController.update
);

export default router;
