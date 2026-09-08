import ThuVienController from "../controllers/thu-vien.controller.js";
import express from "express";
import validateQuery from "../middlewares/validate-query.middleware.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import {
  GetPublicLibraryQuery,
  GetPublicLibraryCategoriesQuery,
  PublicLibraryDocumentParams,
} from "../validators/thu-vien.validator.js";

const taiLieuCongKhaiRouter = express.Router();

// Lấy danh sách tài liệu công khai (không cần auth)
taiLieuCongKhaiRouter.get(
  "/paging",
  validateQuery(GetPublicLibraryQuery),
  ThuVienController.getPublic
);

// Lấy danh mục đang có tài liệu công khai (không cần auth)
taiLieuCongKhaiRouter.get(
  "/categories",
  validateQuery(GetPublicLibraryCategoriesQuery),
  ThuVienController.getPublicCategories
);

// Lấy đường dẫn tải và tăng lượt tải tài liệu công khai (không cần auth)
taiLieuCongKhaiRouter.get(
  "/:id/download",
  validateParams(PublicLibraryDocumentParams),
  ThuVienController.downloadPublic
);

// Lấy chi tiết tài liệu công khai (không cần auth)
taiLieuCongKhaiRouter.get(
  "/:id",
  validateParams(PublicLibraryDocumentParams),
  ThuVienController.getPublicById
);

export default taiLieuCongKhaiRouter;
