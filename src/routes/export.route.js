import express from "express";
import { logAuthMiddleware } from "../middlewares/auth.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import ExportController from "../controllers/export.controller.js";
const exportRouter = express.Router();

exportRouter.post(
  "/phan-anh",
  logAuthMiddleware,
  authenticate,
  ExportController.exportPhanAnhToZip
);

exportRouter.get(
  "/phan-anh",
  authenticate,
  ExportController.getExportPhanAnhList
);

exportRouter.get(
  "/phan-anh/:fileName/download",
  authenticate,
  ExportController.downloadExportPhanAnh
);

exportRouter.delete(
  "/phan-anh/:fileName/delete",
  authenticate,  
  logAuthMiddleware,
  ExportController.deleteExport
);


export default exportRouter;
