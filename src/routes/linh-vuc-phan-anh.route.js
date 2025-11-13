import express from "express";
import LinhVucPhanAnhController from "../controllers/linh-vuc-phan-anh.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import AUDIT_LOGS from "../constants/audit-logs-action.constant.js";
import validate from "../middlewares/validate.middleware.js";
import ROLE from "../constants/role.constant.js";
import { CreateLinhVucPhanAnhRequest } from "../validators/linh-vuc-phan-anh.validator.js";

const linhVucPhanAnh = express.Router();

linhVucPhanAnh.post(
    '/', 
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateLinhVucPhanAnhRequest),
    audit_logs(AUDIT_LOGS.CREATE, 'linh_vuc_phan_anh'),
    LinhVucPhanAnhController.createLinhVucPhanAnh
);

linhVucPhanAnh.get(
    '/', 
    LinhVucPhanAnhController.getAllLinhVucPhanAnh
);

linhVucPhanAnh.put(
    '/:id', 
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateLinhVucPhanAnhRequest),
    audit_logs(AUDIT_LOGS.UPDATE, 'linh_vuc_phan_anh'),
    LinhVucPhanAnhController.updateLinhVucPhanAnh
);

linhVucPhanAnh.put(
    '/update-status/:id', 
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.UPDATE, 'linh_vuc_phan_anh'),
    LinhVucPhanAnhController.updateLinhVucPhanAnhStatus
);

linhVucPhanAnh.get(
    '/search', 
    LinhVucPhanAnhController.searchLinhVucPhanAnhByName
);

linhVucPhanAnh.get(
    '/:id', 
    LinhVucPhanAnhController.getLinhVucPhanAnhById
);

linhVucPhanAnh.delete(
    '/:id', 
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.DELETE, 'linh_vuc_phan_anh'),
    LinhVucPhanAnhController.deleteLinhVucPhanAnh
);

export default linhVucPhanAnh;