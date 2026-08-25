import ThuVienController from "../controllers/thu-vien.controller.js";
import express from "express";

const taiLieuCongKhaiRouter = express.Router();

// Lấy danh sách tài liệu công khai (không cần auth)
taiLieuCongKhaiRouter.get("/paging", ThuVienController.getPublic);

// Lấy chi tiết tài liệu công khai (không cần auth)
taiLieuCongKhaiRouter.get("/:id", ThuVienController.getPublicById);

export default taiLieuCongKhaiRouter;