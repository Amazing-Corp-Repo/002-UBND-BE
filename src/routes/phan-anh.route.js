import PhanAnhController from "../controllers/phan-anh.controller.js";
import express from "express";
import { createUploader } from '../middlewares/upload.middleware.js';
import UPLOAD_TYPE from '../constants/upload.constant.js';
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import AUDIT_LOGS from "../constants/audit-logs-action.constant.js";
import { auditForPhanAnh } from "../middlewares/client-info.middleware.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ROLE from '../constants/role.constant.js';
import validate from '../middlewares/validate.middleware.js';
import { CreatePhanAnhRequest, UpdatePhanAnhStatusRequest } from "../validators/phan-anh.validator.js";

const phanAnhRouter = express.Router();

phanAnhRouter.post(
    "/",
    auditForPhanAnh,
    validate(CreatePhanAnhRequest),
    createUploader({
        type: UPLOAD_TYPE.PHAN_ANH,
        fieldName: "file",
        maxCount: 5,
        maxSizeMB: 5,
        allowed_types: ['image/jpeg', 'image/png'],
    }),
    audit_logs(AUDIT_LOGS.CREATE, 'phan_anh'),
    PhanAnhController.createPhanAnh
);

phanAnhRouter.get(
    "/:maPhanAnh/for-mobile",
    PhanAnhController.getPhanAnhByMaPhanAnh
);

phanAnhRouter.get(
    "/",
    authenticate,
    authorize([ROLE.ADMIN, ROLE.NHAN_VIEN, ROLE.PHO_CHU_TICH, ROLE.CHU_TICH, ROLE.LANH_DAO]),
    PhanAnhController.getAllPhanAnh
);

phanAnhRouter.get(
    "/:idPhanAnh/lich-su-trang-thai",
    PhanAnhController.getLichSuTrangThaiPhanAnh
);

phanAnhRouter.get(
    "/user/me",
    authenticate,
    PhanAnhController.getPhanAnhByUserId
);

phanAnhRouter.get(
    "/muc-do",
    PhanAnhController.getMucDoPhanAnh
);

phanAnhRouter.get(
    "/trang-thai",
    PhanAnhController.getTrangThaiPhanAnh
);

phanAnhRouter.get(
    '/tong-quan',
    authenticate,
    authorize([ROLE.ADMIN, ROLE.NHAN_VIEN, ROLE.PHO_CHU_TICH, ROLE.CHU_TICH, ROLE.LANH_DAO]),
    PhanAnhController.getTongQuanPhanAnh
)

phanAnhRouter.get(
    '/muc-do-trang-thai-linh-vuc',
    PhanAnhController.getMucDoAndTrangThaiAndLinhVuc
);

phanAnhRouter.get(
    '/search-by-tieu-de',
    PhanAnhController.searhByTieuDe
);

phanAnhRouter.get(
    "/:idPhanAnh",
    authenticate,
    authorize([ROLE.ADMIN, ROLE.NHAN_VIEN, ROLE.PHO_CHU_TICH, ROLE.CHU_TICH, ROLE.LANH_DAO]),
    PhanAnhController.getPhanAnhById
);

phanAnhRouter.put(
    "/update-status/:idPhanAnh",
    authenticate,
    authorize([ROLE.ADMIN, ROLE.NHAN_VIEN]),
    validate(UpdatePhanAnhStatusRequest),
    audit_logs(AUDIT_LOGS.UPDATE, 'phan_anh, lich_su_trang_thai'),
    PhanAnhController.updateStatusPhanAnh
);

export default phanAnhRouter;