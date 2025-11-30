import express from "express";
import ThuTucController from "../controllers/thu-tuc.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateThuTucRequest,
  UpdateThucTucStatusRequest,
  UpdateThuTucRequest,
} from "../validators/thu-tuc.validator.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";

const thuTucRoute = express.Router();

thuTucRoute.get('/all', ThuTucController.getAllForMobile);
thuTucRoute.get('/search', ThuTucController.searchThuTuc);

thuTucRoute.get("", ThuTucController.getAll);

thuTucRoute.post(
  "",
  authenticate,
  authorize([PERMISSION.TT_CREATE]),
  validate(CreateThuTucRequest),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.TT_CREATE),
  ThuTucController.createThuTuc
);

thuTucRoute.get("/:id", ThuTucController.getThuTucById);

thuTucRoute.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.TT_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.TT_DELETE),
  ThuTucController.deleteThuTuc
);

thuTucRoute.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.TT_UPDATE]),
  validate(UpdateThuTucRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TT_UPDATE),
  ThuTucController.updateThuTuc
);

thuTucRoute.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.TT_UPDATE_STATUS]),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TT_UPDATE_STATUS),
  validate(UpdateThucTucStatusRequest),
  ThuTucController.updateThuTucStatus
);

thuTucRoute.get("/:id/thanh-phan", ThuTucController.getThanhPhanByThuTucId);

thuTucRoute.get("/:id/mau-don", ThuTucController.getMauDonByThuTucId);

export default thuTucRoute;
