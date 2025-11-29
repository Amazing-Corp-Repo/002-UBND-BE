import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ReportController from "../controllers/report.controller.js";
import { PERMISSION } from "../constants/permission.constant.js";

const reportRouter = express.Router();

reportRouter.get(
  "/tong-hop",
  authenticate,
  authorize([PERMISSION.RPT_GET]),
  ReportController.getBaoCaoTongHop
);

reportRouter.get(
  "/tong-hop/export-excel",
  authenticate,
  authorize([PERMISSION.RPT_GET_EXCEL]),
  ReportController.exportBaoCaoTongHopExcel
);

reportRouter.get(
  "/linh-vuc",
  authenticate,
  authorize([PERMISSION.RPT_GET]),
  ReportController.getBaoCaoLinhVuc
);

reportRouter.get(
  "/linh-vuc/export-excel",
  authenticate,
  authorize([PERMISSION.RPT_GET_EXCEL]),
  ReportController.exportBaoCaoLinhVucExcel
);

reportRouter.get(
  "/trang-thai",
  authenticate,
  authorize([PERMISSION.RPT_GET]),
  ReportController.getBaoCaoTrangThai
);

reportRouter.get(
  "/trang-thai/export-excel",
  authenticate,
  authorize([PERMISSION.RPT_GET_EXCEL]),
  ReportController.exportgetBaoCaoTrangThaiExcel
);

reportRouter.get(
  "/phan-anh",
  authenticate,
  authorize([PERMISSION.RPT_GET]),
  ReportController.getReportPhanAnh
);

reportRouter.get(
  "/thu-tuc",
  authenticate,
  authorize([PERMISSION.RPT_GET]),
  ReportController.getReportThuTuc
);

export default reportRouter;
