import express from "express";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import DangKyTiepDanController from "../controllers/dang-ky-tiep-dan.controller.js";
import { receptionAudit } from "../middlewares/reception-audit.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateDangKyTiepDanRequest,
  LookupDangKyTiepDanRequest,
} from "../validators/dang-ky-tiep-dan.validator.js";

const dangKyTiepDanRouter = express.Router();

dangKyTiepDanRouter.post(
  "/lookup",
  validate(LookupDangKyTiepDanRequest),
  DangKyTiepDanController.lookup
);

dangKyTiepDanRouter.post(
  "/",
  validate(CreateDangKyTiepDanRequest),
  receptionAudit(AUDIT_LOGS.CREATE, {
    sensitiveFields: ["cccd", "sdt"],
  }),
  DangKyTiepDanController.create
);

export default dangKyTiepDanRouter;
