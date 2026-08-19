import express from "express";
import ReceptionScheduleManagementController from "../controllers/reception-schedule-management.controller.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateLichTiepDanRequest,
  GetReceptionScheduleManagementQuery,
  ReceptionScheduleManagementIdParams,
  UpdateLichTiepDanRequest,
  UpdateLStatusLichTiepDanRequest,
} from "../validators/reception-schedule-management.validator.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import validateQuery from "../middlewares/validate-query.middleware.js";

const receptionScheduleManagementRouter = express.Router();

receptionScheduleManagementRouter.post(
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
  ReceptionScheduleManagementController.importLichTiepDan
);

receptionScheduleManagementRouter.get(
  "/",
  authenticate,
  authorize([PERMISSION.LTD_GET_ALL]),
  validateQuery(GetReceptionScheduleManagementQuery),
  ReceptionScheduleManagementController.getLichTiepDan
);

receptionScheduleManagementRouter.get(
  "/pagination",
  ReceptionScheduleManagementController.getLichTiepDanWithPagination
);

receptionScheduleManagementRouter.get(
  "/count",
  ReceptionScheduleManagementController.countLichTiepDan
);

receptionScheduleManagementRouter.get(
  "/template",
  authenticate,
  authorize([PERMISSION.LTD_GET_TEMPLATE]),
  ReceptionScheduleManagementController.getTemplateLichTiepDan
);

receptionScheduleManagementRouter.put(
  "/:id/status",
  authenticate,
  authorize([PERMISSION.LTD_UPDATE_STATUS]),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.LTD_UPDATE_STATUS),
  validate(UpdateLStatusLichTiepDanRequest),
  ReceptionScheduleManagementController.updateStatusLichTiepDan
);

receptionScheduleManagementRouter.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.LTD_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.LTD_DELETE),
  ReceptionScheduleManagementController.deleteLichTiepDan
);

receptionScheduleManagementRouter.get(
  "/:id",
  validateParams(ReceptionScheduleManagementIdParams),
  ReceptionScheduleManagementController.getLichTiepDanById
);

receptionScheduleManagementRouter.post(
  "/",
  authenticate,
  authorize([PERMISSION.LTD_CREATE]),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.LTD_CREATE),
  validate(CreateLichTiepDanRequest),
  ReceptionScheduleManagementController.createLichTiepDan
);

receptionScheduleManagementRouter.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.LTD_UPDATE]),
  validateParams(ReceptionScheduleManagementIdParams),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.LTD_UPDATE),
  validate(UpdateLichTiepDanRequest),
  ReceptionScheduleManagementController.updateLichTiepDan
);

export default receptionScheduleManagementRouter;
