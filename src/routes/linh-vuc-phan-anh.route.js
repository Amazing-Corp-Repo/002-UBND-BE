import express from "express";
import LinhVucPhanAnhController from "../controllers/linh-vuc-phan-anh.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import validate from "../middlewares/validate.middleware.js";
import { CreateLinhVucPhanAnhRequest } from "../validators/linh-vuc-phan-anh.validator.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";

const linhVucPhanAnh = express.Router();

linhVucPhanAnh.post(
  "/",
  authenticate,
  authorize([PERMISSION.LVPA_CREATE]),
  validate(CreateLinhVucPhanAnhRequest),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.LVPA_CREATE),
  LinhVucPhanAnhController.createLinhVucPhanAnh
);

linhVucPhanAnh.get("/", LinhVucPhanAnhController.getAllLinhVucPhanAnh);

linhVucPhanAnh.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.LVPA_UPDATE]),
  validate(CreateLinhVucPhanAnhRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.LVPA_UPDATE),
  LinhVucPhanAnhController.updateLinhVucPhanAnh
);

linhVucPhanAnh.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.LVPA_UPDATE_STATUS]),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.LVPA_UPDATE_STATUS),
  LinhVucPhanAnhController.updateLinhVucPhanAnhStatus
);

linhVucPhanAnh.get(
  "/search",
  LinhVucPhanAnhController.searchLinhVucPhanAnhByName
);

linhVucPhanAnh.get("/:id", LinhVucPhanAnhController.getLinhVucPhanAnhById);

linhVucPhanAnh.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.LVPA_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.LVPA_DELETE),
  LinhVucPhanAnhController.deleteLinhVucPhanAnh
);

export default linhVucPhanAnh;
