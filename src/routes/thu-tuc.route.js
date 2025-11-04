import express from 'express';
import ThuTucController from '../controllers/thu-tuc.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import ROLE from '../constants/role.constant.js';
import validate from '../middlewares/validate.middleware.js';
import { CreateThuTucRequest, UpdateThuTucRequest } from '../validators/thu-tuc.validator.js';
import { audit_logs } from '../middlewares/audit-logs.middleware.js';
import AUDIT_LOGS from '../constants/audit-logs-action.constant.js';

const thuTucRoute = express.Router();

thuTucRoute.get('/all', ThuTucController.getAllForMobile);

thuTucRoute.get(
    '/:id',
    ThuTucController.getThuTucById
);

thuTucRoute.get(
    "",
    ThuTucController.getAll
);

thuTucRoute.post("",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateThuTucRequest),
    audit_logs(AUDIT_LOGS.CREATE, 'thu_tuc_hanh_chinh'),
    ThuTucController.createThuTuc
);

thuTucRoute.delete("/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.DELETE, 'thu_tuc_hanh_chinh'),
    ThuTucController.deleteThuTuc
);

thuTucRoute.put("/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UpdateThuTucRequest),
    audit_logs(AUDIT_LOGS.UPDATE, 'thu_tuc_hanh_chinh'),
    ThuTucController.updateThuTuc
);

thuTucRoute.put("/update-status/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.UPDATE, 'thu_tuc_hanh_chinh'),
    ThuTucController.updateThuTucStatus
);

thuTucRoute.get('/:id/thanh-phan', ThuTucController.getThanhPhanByThuTucId);

thuTucRoute.get('/:id/mau-don', ThuTucController.getMauDonByThuTucId);

export default thuTucRoute;