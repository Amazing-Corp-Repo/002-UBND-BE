import express from "express";
import LinhVucController from "../controllers/linh-vuc.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateLinhVucRequest,
  UpdateLinhVucRequest,
  UpdateLinhVucStatusRequest,
} from "../validators/linh-vuc.validator.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import AUDIT_LOGS from "../constants/audit-logs-action.constant.js";
import { PERMISSION } from "../constants/permission.constant.js";

const linhVucRoute = express.Router();

linhVucRoute.get("/", LinhVucController.getAll);

linhVucRoute.get("/pagination", LinhVucController.getAllWithPagination);

linhVucRoute.post(
  "/",
  authenticate,
  authorize([PERMISSION.LVTTHC_CREATE]),
  validate(CreateLinhVucRequest),
  audit_logs(AUDIT_LOGS.CREATE, "linh_vuc"),
  LinhVucController.create
);

linhVucRoute.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.LVTTHC_UPDATE]),
  validate(UpdateLinhVucRequest),
  audit_logs(AUDIT_LOGS.UPDATE, "linh_vuc"),
  LinhVucController.update
);

linhVucRoute.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.LVTTHC_UPDATE_STATUS]),
  validate(UpdateLinhVucStatusRequest),
  audit_logs(AUDIT_LOGS.UPDATE, "linh_vuc"),
  LinhVucController.updateStatus
);

linhVucRoute.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.LVTTHC_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, "linh_vuc"),
  LinhVucController.delete
);

linhVucRoute.get("/:id", LinhVucController.getLinhVucById);

export default linhVucRoute;
