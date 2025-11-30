import TinTucController from "../controllers/tin-tuc.controller.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateTinTucRequest,
  UpdateStatusTinTucRequest,
  UpdateTinTucRequest,
  UploadFileDinhKemRequest,
} from "../validators/tin-tuc.validator.js";
import { audit_logs } from '../middlewares/audit-logs.middleware.js';
import { AUDIT_LOGS } from '../constants/audit-logs-action.constant.js';
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";
import { clientInfo } from "../middlewares/client-info.middleware.js";

const tinTucRouter = express.Router();

tinTucRouter.post(
  "/upload",
  authenticate,
  authorize([PERMISSION.TTIN_CREATE]),
  validate(UploadFileDinhKemRequest),
  createUploader({
    type: UPLOAD_TYPE.TIN_TUC,
    fieldName: "file",
    maxCount: 1,
    maxSizeMB: 10,
    allowed_types: ["image/png", "image/jpeg"],
  }),
  audit_logs(AUDIT_LOGS.CREATE, "dinh_kem_tin_tuc"),
  TinTucController.uploadFile
);

tinTucRouter.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.TTIN_UPDATE]),
  validate(UpdateTinTucRequest),
  createUploader({
    type: UPLOAD_TYPE.TIN_TUC,
    fieldName: "file",
    maxCount: 1,
    maxSizeMB: 10,
    allowed_types: ["image/png", "image/jpeg"],
  }),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TTIN_UPDATE),
  TinTucController.updateTinTuc
);

tinTucRouter.get(
  "/view/:id",
  clientInfo,
  TinTucController.getTinTucToView
);

tinTucRouter.get("/:id", TinTucController.getDetails);

tinTucRouter.get("/", TinTucController.getAll);

tinTucRouter.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.TTIN_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.TTIN_DELETE),
  TinTucController.delete
);

tinTucRouter.post(
  "/",
  authenticate,
  authorize([PERMISSION.TTIN_CREATE]),
  validate(CreateTinTucRequest),
  createUploader({
    type: UPLOAD_TYPE.TIN_TUC,
    fieldName: "file",
    maxCount: 1,
    maxSizeMB: 10,
    allowed_types: ["image/png", "image/jpeg"],
  }),
  TinTucController.create
);

tinTucRouter.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.TTIN_UPDATE_STATUS]),
  validate(UpdateStatusTinTucRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TTIN_UPDATE_STATUS),
  TinTucController.updateStatus
);

export default tinTucRouter;
