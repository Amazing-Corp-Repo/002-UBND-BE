import ThuVienController from "../controllers/thu-vien.controller.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateVanHoaRequest,
  UpdateVanHoaRequest,
  UpdateStatusTaiLieuRequest,
  AiLearnRequest,
  ApproveTaiLieuRequest,
  RejectTaiLieuRequest,
} from "../validators/thu-vien.validator.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";

const taiLieuVanHoaRouter = express.Router();

// Middleware gắn loại tài liệu
taiLieuVanHoaRouter.use((req, res, next) => {
  req.loai = "VAN_HOA";
  next();
});

// === STATIC ROUTES (đặt trước route có :id) ===

// Thống kê
taiLieuVanHoaRouter.get("/statistics", authenticate, ThuVienController.getStatistics);

// Danh sách tiểu mục
taiLieuVanHoaRouter.get("/sub-categories", authenticate, ThuVienController.getSubCategories);

// Lấy danh sách (phân trang)
taiLieuVanHoaRouter.get("/paging", authenticate, ThuVienController.getAll);

// Xuất Excel
taiLieuVanHoaRouter.get(
  "/export",
  authenticate,
  authorize([PERMISSION.TL_EXPORT]),
  ThuVienController.export,
);

// Cập nhật trạng thái
taiLieuVanHoaRouter.put(
  "/update-status/:id",
  authenticate,
  authorize([PERMISSION.TL_UPDATE_STATUS]),
  validate(UpdateStatusTaiLieuRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_UPDATE_STATUS),
  ThuVienController.updateStatus,
);

// Đồng bộ AI
taiLieuVanHoaRouter.post(
  "/ai-learn/:id",
  authenticate,
  authorize([PERMISSION.TL_AI_LEARN]),
  validate(AiLearnRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_AI_LEARN),
  ThuVienController.aiLearn,
);

// Phê duyệt tài liệu
taiLieuVanHoaRouter.put(
  "/approve/:id",
  authenticate,
  authorize([PERMISSION.TL_APPROVE]),
  validate(ApproveTaiLieuRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_APPROVE),
  ThuVienController.approve,
);

// Từ chối tài liệu
taiLieuVanHoaRouter.put(
  "/reject/:id",
  authenticate,
  authorize([PERMISSION.TL_REJECT]),
  validate(RejectTaiLieuRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_REJECT),
  ThuVienController.reject,
);

// Hoàn tác phê duyệt tài liệu
taiLieuVanHoaRouter.put(
  "/unapprove/:id",
  authenticate,
  authorize([PERMISSION.TL_UNAPPROVE]),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_UNAPPROVE),
  ThuVienController.unapprove,
);

// === PARAM ROUTES (có :id) ===

// Lấy chi tiết
taiLieuVanHoaRouter.get("/:id", authenticate, authorize([PERMISSION.TL_GET_DETAIL]), ThuVienController.getById);

// Download
taiLieuVanHoaRouter.get("/:id/download", authenticate, authorize([PERMISSION.TL_DOWNLOAD]), ThuVienController.download);

// Tạo mới
taiLieuVanHoaRouter.post(
  "/",
  authenticate,
  authorize([PERMISSION.TL_CREATE]),
  createUploader({
    type: UPLOAD_TYPE.THU_VIEN,
    fields: [
      { fieldName: "file", maxCount: 1, maxSizeMB: 50, allowed_types: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
      { fieldName: "images", maxCount: 10, maxSizeMB: 10, allowed_types: ["image/jpeg", "image/png", "image/gif", "image/webp"] },
      { fieldName: "videos", maxCount: 5, maxSizeMB: 200, allowed_types: ["video/mp4", "video/mpeg", "video/quicktime"] },
    ],
  }),
  validate(CreateVanHoaRequest),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.TL_CREATE),
  ThuVienController.create,
);

// Cập nhật
taiLieuVanHoaRouter.put(
  "/:id",
  authenticate,
  authorize([PERMISSION.TL_UPDATE]),
  createUploader({
    type: UPLOAD_TYPE.THU_VIEN,
    fields: [
      { fieldName: "file", maxCount: 1, maxSizeMB: 50, allowed_types: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
      { fieldName: "images", maxCount: 10, maxSizeMB: 10, allowed_types: ["image/jpeg", "image/png", "image/gif", "image/webp"] },
      { fieldName: "videos", maxCount: 5, maxSizeMB: 200, allowed_types: ["video/mp4", "video/mpeg", "video/quicktime"] },
    ],
  }),
  validate(UpdateVanHoaRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.TL_UPDATE),
  ThuVienController.update,
);

// Xóa
taiLieuVanHoaRouter.delete(
  "/:id",
  authenticate,
  authorize([PERMISSION.TL_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.TL_DELETE),
  ThuVienController.delete,
);

// Xóa media
taiLieuVanHoaRouter.delete(
  "/:id/media/:mediaId",
  authenticate,
  authorize([PERMISSION.TL_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, "TL_MEDIA"),
  ThuVienController.deleteMedia,
);

export default taiLieuVanHoaRouter;