import express from "express";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import DangKyTiepDanController from "../controllers/dang-ky-tiep-dan.controller.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { CreateDangKyTiepDanRequest } from "../validators/dang-ky-tiep-dan.validator.js";

const dangKyTiepDanRouter = express.Router();

dangKyTiepDanRouter.post(
  "/",
  validate(CreateDangKyTiepDanRequest),
  audit_logs(AUDIT_LOGS.CREATE, "dang_ky_tiep_dan", {
    sensitiveFields: ["cccd", "sdt"],
  }),
  DangKyTiepDanController.create
);

export default dangKyTiepDanRouter;
