import ThuVienController from "../controllers/thu-vien.controller.js";
import express from "express";
import validateQuery from "../middlewares/validate-query.middleware.js";
import validateParams from "../middlewares/validate-params.middleware.js";
import {
  GetPublicLibraryQuery,
  PublicLibraryDocumentParams,
} from "../validators/thu-vien.validator.js";

const taiLieuCongKhaiRouter = express.Router();

// Lấy danh sách tài liệu công khai (không cần auth)
taiLieuCongKhaiRouter.get(
  "/paging",
  validateQuery(GetPublicLibraryQuery),
  ThuVienController.getPublic
);

// Lấy chi tiết tài liệu công khai (không cần auth)
taiLieuCongKhaiRouter.get(
  "/:id",
  validateParams(PublicLibraryDocumentParams),
  ThuVienController.getPublicById
);

export default taiLieuCongKhaiRouter;
