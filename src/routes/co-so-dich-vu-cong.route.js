import express from "express";
import CoSoDichVuCongController from "../controllers/co-so-dich-vu-cong.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateCoSoDichVuCongRequest,
  UpdateCoSoDichVuCongRequest,
  UpdateStatusCoSoDichVuCongRequest,
} from "../validators/co-so-dich-vu-cong.validator.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";

const coSoDichVuCongRoute = express.Router();

coSoDichVuCongRoute.get("", CoSoDichVuCongController.getAll);

coSoDichVuCongRoute.get(
  "/pagination",
  CoSoDichVuCongController.getAllWithPagination
);

coSoDichVuCongRoute.post(
  "",
  authenticate,
  authorize([PERMISSION.CSV_CREATE]),
  validate(CreateCoSoDichVuCongRequest),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.CSV_CREATE),
  CoSoDichVuCongController.create
);

coSoDichVuCongRoute.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.CSV_UPDATE_STATUS]),
  validate(UpdateStatusCoSoDichVuCongRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.CSV_UPDATE_STATUS),
  CoSoDichVuCongController.updateStatus
);

coSoDichVuCongRoute.get("/:id", CoSoDichVuCongController.findById);

coSoDichVuCongRoute.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.CSV_UPDATE]),
  validate(UpdateCoSoDichVuCongRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.CSV_UPDATE),
  CoSoDichVuCongController.update
);

coSoDichVuCongRoute.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.CSV_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.CSV_DELETE),
  CoSoDichVuCongController.delete
);

export default coSoDichVuCongRoute;
