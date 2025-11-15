import express from 'express';
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ROLE from '../constants/role.constant.js';
import validate from '../middlewares/validate.middleware.js';
import ReportController from '../controllers/report.controller.js';

const reportRouter = express.Router();

reportRouter.get(
    '/tong-hop',
    authenticate,
    authorize([ROLE.ADMIN, ROLE.PHO_CHU_TICH, ROLE.CHU_TICH, ROLE.LANH_DAO]),
    ReportController.getBaoCaoTongHop
);

reportRouter.get(
    '/tong-hop/export-excel',
    authenticate,
    authorize([ROLE.ADMIN, ROLE.PHO_CHU_TICH, ROLE.CHU_TICH, ROLE.LANH_DAO]),
    ReportController.exportBaoCaoTongHopExcel
);

reportRouter.get(
    '/linh-vuc',
    authenticate,
    authorize([ROLE.ADMIN, ROLE.PHO_CHU_TICH, ROLE.CHU_TICH, ROLE.LANH_DAO]),
    ReportController.getBaoCaoLinhVuc
);

reportRouter.get(
    '/linh-vuc/export-excel',
    authenticate,
    authorize([ROLE.ADMIN, ROLE.PHO_CHU_TICH, ROLE.CHU_TICH, ROLE.LANH_DAO]),
    ReportController.exportBaoCaoLinhVucExcel
);

reportRouter.get(
    '/trang-thai',
    authenticate,
    authorize([ROLE.ADMIN, ROLE.PHO_CHU_TICH, ROLE.CHU_TICH, ROLE.LANH_DAO]),
    ReportController.getBaoCaoTrangThai
);

reportRouter.get(
    '/trang-thai/export-excel',
    authenticate,
    authorize([ROLE.ADMIN, ROLE.PHO_CHU_TICH, ROLE.CHU_TICH, ROLE.LANH_DAO]),
    ReportController.exportgetBaoCaoTrangThaiExcel
);

export default reportRouter;