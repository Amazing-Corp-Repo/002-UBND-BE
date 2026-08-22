import ThuVienController from "../controllers/thu-vien.controller.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreatePhapLuatRequest,
  UpdatePhapLuatRequest,
  UpdateStatusTaiLieuRequest,
  AiLearnRequest,
  ApproveTaiLieuRequest,
  RejectTaiLieuRequest,
} from "../validators/thu-vien.validator.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";

const taiLieuPhapLuatRouter = express.Router();

// Middleware gắn loại tài liệu
taiLieuPhapLuatRouter.use((req, res, next) => {
  req.loai = "PHAP_LUAT";
  next();
});

// === STATIC ROUTES (đặt trước route có :id) ===

// Thống kê
taiLieuPhapLuatRouter.get("/statistics", authenticate, ThuVienController.getStatistics);

// Danh sách loại văn bản
taiLieuPhapLuatRouter.get("/doc-types", authenticate, ThuVienController.getDocTypes);

// Danh sách cơ quan ban hành
taiLieuPhapLuatRouter.get("/issuing-agencies", authenticate, ThuVienController.getIssuingAgencies);

// Lấy danh sách (phân trang)
taiLieuPhapLuatRouter.get("/paging", authenticate, authorize([PERMISSION.TL_GET_ALL]), ThuVienController.getAll);

// Cập nhật trạng thái
taiLieuPhapLuatRouter.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.TL_UPDATE_STATUS]),
  validate(UpdateStatusTaiLieuRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_UPDATE_STATUS),
  ThuVienController.updateStatus,
);

// Đồng bộ AI
taiLieuPhapLuatRouter.post(
  "/ai-learn/:id",
  authenticate,
  authorize([PERMISSION.TL_AI_LEARN]),
  validate(AiLearnRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_AI_LEARN),
  ThuVienController.aiLearn,
);

// Phê duyệt tài liệu
taiLieuPhapLuatRouter.put(
  "/approve/:id",
  authenticate,
  authorize([PERMISSION.TL_APPROVE]),
  validate(ApproveTaiLieuRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_APPROVE),
  ThuVienController.approve,
);

// Từ chối tài liệu
taiLieuPhapLuatRouter.put(
  "/reject/:id",
  authenticate,
  authorize([PERMISSION.TL_REJECT]),
  validate(RejectTaiLieuRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_REJECT),
  ThuVienController.reject,
);

// === PARAM ROUTES (có :id) ===

// Lấy chi tiết
taiLieuPhapLuatRouter.get("/:id", authenticate, authorize([PERMISSION.TL_GET_DETAIL]), ThuVienController.getById);

// Download
taiLieuPhapLuatRouter.get("/:id/download", authenticate, authorize([PERMISSION.TL_DOWNLOAD]), ThuVienController.download);

// Tạo mới
taiLieuPhapLuatRouter.post(
  "/",
  authenticate,
  authorize([PERMISSION.TL_CREATE]),
  createUploader({
    type: UPLOAD_TYPE.THU_VIEN,
    fieldName: "file",
    maxCount: 1,
    maxSizeMB: 50,
    allowed_types: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  }),
  validate(CreatePhapLuatRequest),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.TL_CREATE),
  ThuVienController.create,
);

// Cập nhật
taiLieuPhapLuatRouter.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.TL_UPDATE]),
  createUploader({
    type: UPLOAD_TYPE.THU_VIEN,
    fieldName: "file",
    maxCount: 1,
    maxSizeMB: 50,
    allowed_types: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  }),
  validate(UpdatePhapLuatRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_UPDATE),
  ThuVienController.update,
);

// Xóa
taiLieuPhapLuatRouter.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.TL_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.TL_DELETE),
  ThuVienController.delete,
);

export default taiLieuPhapLuatRouter;