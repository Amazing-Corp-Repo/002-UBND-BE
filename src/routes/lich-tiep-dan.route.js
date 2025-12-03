import express from "express";
import LichTiepDanController from "../controllers/lich-tiep-dan.controller.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateLichTiepDanRequest,
  UpdateLichTiepDanRequest,
  UpdateLStatusLichTiepDanRequest,
} from "../validators/lich-tiep-dan.validator.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";

const lichTiepDanRouter = express.Router();

lichTiepDanRouter.post(
  "/import",
  authenticate,
  authorize([PERMISSION.LTD_CREATE]),
  createUploader({
    type: UPLOAD_TYPE.LICH_TIEP_DAN,
    fieldName: "file",
    maxCount: 1,
    maxSizeMB: 10,
    allowed_types: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
  }),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.LTD_CREATE),
  LichTiepDanController.importLichTiepDan
);

lichTiepDanRouter.get("/", LichTiepDanController.getLichTiepDan);

lichTiepDanRouter.get(
  "/pagination",
  LichTiepDanController.getLichTiepDanWithPagination
);

lichTiepDanRouter.get("/count", LichTiepDanController.countLichTiepDan);

lichTiepDanRouter.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.LTD_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.LTD_DELETE),
  LichTiepDanController.deleteLichTiepDan
);

lichTiepDanRouter.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.LTD_UPDATE_STATUS]),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.LTD_UPDATE_STATUS),
  validate(UpdateLStatusLichTiepDanRequest),
  LichTiepDanController.updateStatusLichTiepDan
);

lichTiepDanRouter.get(
  "/template",
  authenticate,
  authorize([PERMISSION.LTD_GET_TEMPLATE]),
  LichTiepDanController.getTemplateLichTiepDan
);

lichTiepDanRouter.get("/:id", LichTiepDanController.getLichTiepDanById);

lichTiepDanRouter.post(
  "/",
  authenticate,
  authorize([PERMISSION.LTD_CREATE]),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.LTD_CREATE),
  validate(CreateLichTiepDanRequest),
  LichTiepDanController.createLichTiepDan
);

lichTiepDanRouter.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.LTD_UPDATE]),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.LTD_UPDATE),
  validate(UpdateLichTiepDanRequest),
  LichTiepDanController.updateLichTiepDan
);

export default lichTiepDanRouter;
