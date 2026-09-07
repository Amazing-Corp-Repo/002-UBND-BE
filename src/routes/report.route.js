import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ReportController from "../controllers/report.controller.js";
import { PERMISSION } from "../constants/permission.constant.js";

const reportRouter = express.Router();

reportRouter.get(
  "/phan-anh",
  authenticate,
  authorize([PERMISSION.RPT_GET_DETAIL]),
  ReportController.getReportPhanAnh
);

reportRouter.get(
  "/phan-anh/theo-thang",
  authenticate,
  authorize([PERMISSION.RPT_GET_DETAIL]),
  ReportController.getPhanAnhTheoThang
);

reportRouter.get(
  "/phan-anh/chi-tiet",
  authenticate,
  authorize([PERMISSION.RPT_GET_DETAIL]),
  ReportController.getChiTietPhanAnh
);

reportRouter.get(
  "/phan-anh/chi-tiet/export",
  authenticate,
  authorize([PERMISSION.RPT_GET_EXCEL]),
  ReportController.exportChiTietPhanAnh
);

reportRouter.get(
  "/thu-tuc",
  authenticate,
  authorize([PERMISSION.RPT_GET_DETAIL]),
  ReportController.getReportThuTuc
);

reportRouter.get(
  "/tin-tuc",
  authenticate,
  authorize([PERMISSION.RPT_GET_DETAIL]),
  ReportController.getReportTinTuc
);

reportRouter.get(
  "/phan-anh/export",
  authenticate,
  authorize([PERMISSION.RPT_GET_EXCEL]),
  ReportController.exportReportPhanAnh
);

reportRouter.get(
  "/thu-tuc/export",
  authenticate,
  authorize([PERMISSION.RPT_GET_EXCEL]),
  ReportController.exportReportThuTuc
);

reportRouter.get(
  "/tin-tuc/export",
  authenticate,
  authorize([PERMISSION.RPT_GET_EXCEL]),
  ReportController.exportReportTinTuc
);

reportRouter.get(
  "/danh-gia/export",
  authenticate,
  authorize([PERMISSION.RPT_GET_EXCEL]),
  ReportController.exportDanhGia
);

export default reportRouter;
