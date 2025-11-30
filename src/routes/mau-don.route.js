import express from "express";
import MauDonController from "../controllers/mau-don.controller.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateMauDonRequest,
  UpdateMauDonRequest,
  UpdateStatusMauDonRequest,
} from "../validators/mau-don.validator.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";

const mauDonRouter = express.Router();

mauDonRouter.post(
  "/",
  authenticate,
  authorize([PERMISSION.MD_CREATE]),
  validate(CreateMauDonRequest),
  createUploader({
    type: UPLOAD_TYPE.MAU_DON,
    fieldName: "file",
    maxCount: 1,
    maxSizeMB: 10,
    allowed_types: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ],
  }),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.MD_CREATE),
  MauDonController.createMauDon
);

mauDonRouter.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.MD_UPDATE]),
  validate(UpdateMauDonRequest),
  createUploader({
    type: UPLOAD_TYPE.MAU_DON,
    fieldName: "file",
    maxCount: 1,
    maxSizeMB: 10,
    allowed_types: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ],
  }),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.MD_UPDATE),
  MauDonController.updateMauDon
);

mauDonRouter.get("/", MauDonController.getAllMauDon);

mauDonRouter.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.MD_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.MD_DELETE),
  MauDonController.deleteMauDon
);

mauDonRouter.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.MD_UPDATE_STATUS]),
  validate(UpdateStatusMauDonRequest),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.MD_UPDATE_STATUS),
  MauDonController.updateStatusMauDon
);

mauDonRouter.get("/paging", MauDonController.getAllMauDonWithPaging);

mauDonRouter.get("/:id", MauDonController.getMauDonById);

export default mauDonRouter;
