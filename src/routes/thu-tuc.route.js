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
import AUDIT_LOGS from "../constants/audit-logs-action.constant.js";
import { PERMISSION } from "../constants/permission.constant.js";

const thuTucRoute = express.Router();

thuTucRoute.get('/all', ThuTucController.getAllForMobile);
thuTucRoute.get('/search', ThuTucController.searchThuTuc);

thuTucRoute.get("", ThuTucController.getAll);

thuTucRoute.post(
  "",
  authenticate,
  authorize([PERMISSION.TT_CREATE]),
  validate(CreateThuTucRequest),
  audit_logs(AUDIT_LOGS.CREATE, "thu_tuc_hanh_chinh"),
  ThuTucController.createThuTuc
);

thuTucRoute.get("/:id", ThuTucController.getThuTucById);

thuTucRoute.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.TT_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, "thu_tuc_hanh_chinh"),
  ThuTucController.deleteThuTuc
);

thuTucRoute.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.TT_UPDATE]),
  validate(UpdateThuTucRequest),
  audit_logs(AUDIT_LOGS.UPDATE, "thu_tuc_hanh_chinh"),
  ThuTucController.updateThuTuc
);

thuTucRoute.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.TT_UPDATE_STATUS]),
  audit_logs(AUDIT_LOGS.UPDATE, "thu_tuc_hanh_chinh"),
  validate(UpdateThucTucStatusRequest),
  ThuTucController.updateThuTucStatus
);

thuTucRoute.get("/:id/thanh-phan", ThuTucController.getThanhPhanByThuTucId);

thuTucRoute.get("/:id/mau-don", ThuTucController.getMauDonByThuTucId);

export default thuTucRoute;
