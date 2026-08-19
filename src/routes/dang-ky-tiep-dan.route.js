import express from "express";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import DangKyTiepDanController from "../controllers/dang-ky-tiep-dan.controller.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import validateQuery from "../middlewares/validate-query.middleware.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { PERMISSION } from "../constants/permission.constant.js";
import receptionRegistrationRateLimiter, {
  receptionLookupRateLimiter,
} from "../middlewares/reception-registration-rate-limit.middleware.js";
import {
  CreateDangKyTiepDanRequest,
  ApproveReceptionRegistrationRequest,
  GetDangKyTiepDanQuery,
  LookupDangKyTiepDanRequest,
  ReceptionRegistrationIdParams,
  ReceptionCodeParams,
  RejectReceptionRegistrationRequest,
} from "../validators/dang-ky-tiep-dan.validator.js";

const dangKyTiepDanRouter = express.Router();

dangKyTiepDanRouter.get(
  "/",
  authenticate,
  authorize([PERMISSION.RR_GET_ALL]),
  validateQuery(GetDangKyTiepDanQuery),
  DangKyTiepDanController.getAll
);

dangKyTiepDanRouter.patch(
  "/:id/approve",
  authenticate,
  authorize([PERMISSION.RR_APPROVE]),
  validateParams(ReceptionRegistrationIdParams),
  validate(ApproveReceptionRegistrationRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, {
    sensitiveFields: ["citizenId", "phoneNumber", "cccd", "sdt"],
  }),
  DangKyTiepDanController.approve
);

dangKyTiepDanRouter.patch(
  "/:id/complete",
  authenticate,
  authorize([PERMISSION.RR_COMPLETE]),
  validateParams(ReceptionRegistrationIdParams),
  receptionAudit(AUDIT_LOGS.UPDATE, {
    sensitiveFields: ["citizenId", "phoneNumber", "cccd", "sdt"],
  }),
  DangKyTiepDanController.complete
);

dangKyTiepDanRouter.patch(
  "/:id/reject",
  authenticate,
  authorize([PERMISSION.RR_REJECT]),
  validateParams(ReceptionRegistrationIdParams),
  validate(RejectReceptionRegistrationRequest),
  receptionAudit(AUDIT_LOGS.UPDATE, {
    sensitiveFields: ["citizenId", "phoneNumber", "cccd", "sdt"],
  }),
  DangKyTiepDanController.reject
);

dangKyTiepDanRouter.post(
  "/lookup",
  receptionLookupRateLimiter,
  validate(LookupDangKyTiepDanRequest),
  DangKyTiepDanController.lookup
);

dangKyTiepDanRouter.get(
  "/rating-lookup/:receptionCode",
  validateParams(ReceptionCodeParams),
  DangKyTiepDanController.lookupForRating
);

dangKyTiepDanRouter.get(
  "/:id",
  authenticate,
  authorize([PERMISSION.RR_GET_DETAIL]),
  validateParams(ReceptionRegistrationIdParams),
  DangKyTiepDanController.getDetail
);

dangKyTiepDanRouter.post(
  "/",
  receptionRegistrationRateLimiter,
  validate(CreateDangKyTiepDanRequest),
  receptionAudit(AUDIT_LOGS.CREATE, {
    sensitiveFields: ["cccd", "sdt"],
  }),
  DangKyTiepDanController.create
);

export default dangKyTiepDanRouter;
