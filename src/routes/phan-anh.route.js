import PhanAnhController from "../controllers/phan-anh.controller.js";
import express from "express";
import { createUploader } from "../middlewares/upload.middleware.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreatePhanAnhRequest,
  UpdatePhanAnhStatusRequest,
  CreatePhanAnhPublicRequest,
  UpdatePhanAnhLinhVucRequest,
  AssignPhanAnhRequest,
} from "../validators/phan-anh.validator.js";
import {
  PERMISSION,
  PERMISSION_DESC,
} from "../constants/permission.constant.js";

const phanAnhRouter = express.Router();

// API công khai - Tạo phản ánh không cần đăng nhập
phanAnhRouter.post(
  "/public/create",
  validate(CreatePhanAnhPublicRequest),
  createUploader({
    type: UPLOAD_TYPE.PHAN_ANH,
    fieldName: "file",
    maxCount: 5,
    maxSizeMB: 5,
    allowed_types: ["image/jpeg", "image/png"],
  }),
  PhanAnhController.createPhanAnhPublic,
);

// Existing routes below
phanAnhRouter.post(
  "/",
  authenticate,
  authorize([PERMISSION.PA_CREATE]),
  validate(CreatePhanAnhRequest),
  createUploader({
    type: UPLOAD_TYPE.PHAN_ANH,
    fieldName: "file",
    maxCount: 5,
    maxSizeMB: 5,
    allowed_types: ["image/jpeg", "image/png"],
  }),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.PA_CREATE),
  PhanAnhController.createPhanAnh,
);

phanAnhRouter.get(
  "/:maPhanAnh/for-mobile",
  PhanAnhController.getPhanAnhByMaPhanAnh,
);

phanAnhRouter.get(
  "/",
  authenticate,
  authorize([PERMISSION.PA_GET_ALL]),
  PhanAnhController.getAllPhanAnh,
);

phanAnhRouter.get(
  "/:idPhanAnh/lich-su-trang-thai",
  PhanAnhController.getLichSuTrangThaiPhanAnh,
);

phanAnhRouter.get(
  "/user/me",
  authenticate,
  PhanAnhController.getPhanAnhByUserId,
);

phanAnhRouter.get("/muc-do", PhanAnhController.getMucDoPhanAnh);

phanAnhRouter.get("/trang-thai", PhanAnhController.getTrangThaiPhanAnh);

phanAnhRouter.get(
  "/tong-quan",
  authenticate,
  PhanAnhController.getTongQuanPhanAnh,
);

phanAnhRouter.get(
  "/muc-do-trang-thai-linh-vuc",
  PhanAnhController.getMucDoAndTrangThaiAndLinhVuc,
);

phanAnhRouter.get("/search-by-tieu-de", PhanAnhController.searhByTieuDe);

phanAnhRouter.get("/search-by-tieu-de", PhanAnhController.searhByTieuDe);

phanAnhRouter.get(
  "/:idPhanAnh",
  authenticate,
  authorize([PERMISSION.PA_GET_DETAIL]),
  PhanAnhController.getPhanAnhById,
);

phanAnhRouter.put(
  "/update-status/:idPhanAnh",
  authenticate,
  authorize([PERMISSION.PA_UPDATE_STATUS]),
  // Cho phép đính kèm ảnh hiện trường khi cập nhật trạng thái (bắt buộc khi "Đã giải quyết").
  // Uploader chạy TRƯỚC validate để multer parse text fields vào req.body + ảnh vào req.files.
  createUploader({
    type: UPLOAD_TYPE.PHAN_ANH,
    fieldName: "file",
    maxCount: 5,
    maxSizeMB: 5,
    allowed_types: [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  }),
  validate(UpdatePhanAnhStatusRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.PA_UPDATE_STATUS),
  PhanAnhController.updateStatusPhanAnh,
);

phanAnhRouter.put(
  "/update-linh-vuc/:idPhanAnh",
  authenticate,
  authorize([PERMISSION.PA_UPDATE_STATUS]),
  validate(UpdatePhanAnhLinhVucRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.PA_UPDATE_LINH_VUC),
  PhanAnhController.updateLinhVucPhanAnh,
);

// Danh sách chuyên viên có thể phân công (cán bộ quản lý lĩnh vực của phản ánh)
phanAnhRouter.get(
  "/:idPhanAnh/nguoi-xu-ly",
  authenticate,
  authorize([PERMISSION.PA_ASSIGN]),
  PhanAnhController.getAssignableUsers,
);

// Phân công / chuyển phản ánh cho chuyên viên khác xử lý
phanAnhRouter.put(
  "/assign/:idPhanAnh",
  authenticate,
  authorize([PERMISSION.PA_ASSIGN]),
  validate(AssignPhanAnhRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.PA_ASSIGN),
  PhanAnhController.assignPhanAnh,
);

export default phanAnhRouter;
