import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import DanhMucTinTucController from "../controllers/danh-muc-tin-tuc.controller.js";
import {
  CreateDanhMucTinTucRequest,
  UpdateDanhMucTinTucRequest,
} from "../validators/danh-muc-tin-tuc.validator.js";
import validate from "../middlewares/validate.middleware.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";

const danhMucTinTucRouter = express.Router();

danhMucTinTucRouter.post(
  "",
  authenticate,
  authorize([PERMISSION.DMTT_CREATE]),
  validate(CreateDanhMucTinTucRequest),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.DMTT_CREATE),
  DanhMucTinTucController.create
);

danhMucTinTucRouter.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.DMTT_UPDATE]),
  validate(UpdateDanhMucTinTucRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.DMTT_UPDATE),
  DanhMucTinTucController.update
);

danhMucTinTucRouter.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.DMTT_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.DMTT_DELETE),
  DanhMucTinTucController.delete
);

danhMucTinTucRouter.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.DMTT_UPDATE_STATUS]),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.DMTT_UPDATE_STATUS),
  DanhMucTinTucController.updateStatus
);

danhMucTinTucRouter.get("", DanhMucTinTucController.findAll);

danhMucTinTucRouter.get(
  "/pagination",
  DanhMucTinTucController.findAllWithPagination
);

danhMucTinTucRouter.get("/:id", DanhMucTinTucController.findById);

export default danhMucTinTucRouter;
