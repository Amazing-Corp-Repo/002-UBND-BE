import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ReportController from "../controllers/report.controller.js";
import { PERMISSION } from "../constants/permission.constant.js";

const reportRouter = express.Router();

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

reportRouter.get(
  "/tin-tuc",
  authenticate,
  authorize([PERMISSION.RPT_GET]),
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
  authorize([PERMISSION.RPT_GET]),
  ReportController.exportReportTinTuc
);

export default reportRouter;
