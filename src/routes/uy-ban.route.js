import express from "express";
import UyBanController from "../controllers/uy-ban.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateUyBanRequest,
  UpdateUyBanRequest,
} from "../validators/uy-ban.validator.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";

const uyBanRouter = express.Router();

uyBanRouter.post(
  "/",
  authenticate,
  authorize([PERMISSION.UB_CREATE]),
  validate(CreateUyBanRequest),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.UB_CREATE),
  UyBanController.create
);
uyBanRouter.get("/", UyBanController.getFrist);

uyBanRouter.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.UB_UPDATE]),
  validate(UpdateUyBanRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.UB_UPDATE),
  UyBanController.update
);

export default uyBanRouter;
