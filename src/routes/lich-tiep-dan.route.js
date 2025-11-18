import express from "express";
import LichTiepDanController from "../controllers/lich-tiep-dan.controller.js";
import { createUploader } from "../middlewares/upload.middleware.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ROLE from "../constants/role.constant.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import AUDIT_LOGS from "../constants/audit-logs-action.constant.js";
import validate from '../middlewares/validate.middleware.js';
import { CreateLichTiepDanRequest, UpdateLichTiepDanRequest, UpdateLStatusLichTiepDanRequest } from "../validators/lich-tiep-dan.validator.js";

const lichTiepDanRouter = express.Router();

lichTiepDanRouter.post('/import',
    authenticate,
    authorize([ROLE.ADMIN]),
    createUploader({
        type: UPLOAD_TYPE.LICH_TIEP_DAN,
        fieldName: 'file',
        maxCount: 1,
        maxSizeMB: 10,
        allowed_types: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ],
    }),
    audit_logs(AUDIT_LOGS.CREATE, 'lich_tiep_dan'),
    LichTiepDanController.importLichTiepDan
);

lichTiepDanRouter.get('/',
    LichTiepDanController.getLichTiepDan
);

lichTiepDanRouter.get('/pagination',
    LichTiepDanController.getLichTiepDanWithPagination
);

lichTiepDanRouter.delete('/:id',
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.DELETE, 'lich_tiep_dan'),
    LichTiepDanController.deleteLichTiepDan
);

lichTiepDanRouter.put(
    '/update-status/:id',
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.UPDATE, 'lich_tiep_dan'),
    validate(UpdateLStatusLichTiepDanRequest),
    LichTiepDanController.updateStatusLichTiepDan
);

lichTiepDanRouter.get('/template',
    authenticate,
    authorize([ROLE.ADMIN]),
    LichTiepDanController.getTemplateLichTiepDan
);

lichTiepDanRouter.get('/:id',
    LichTiepDanController.getLichTiepDanById
);

lichTiepDanRouter.post('/',
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.CREATE, 'lich_tiep_dan'),
    validate(CreateLichTiepDanRequest),
    LichTiepDanController.createLichTiepDan
);

lichTiepDanRouter.put(
    '/:id',
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.UPDATE, 'lich_tiep_dan'),
    validate(UpdateLichTiepDanRequest),
    LichTiepDanController.updateLichTiepDan
);

export default lichTiepDanRouter;