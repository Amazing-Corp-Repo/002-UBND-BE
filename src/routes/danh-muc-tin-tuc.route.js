import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ROLE from "../constants/role.constant.js";
import DanhMucTinTucController from "../controllers/danh-muc-tin-tuc.controller.js";
import { CreateDanhMucTinTucRequest, UpdateDanhMucTinTucRequest } from "../validators/danh-muc-tin-tuc.validator.js";
import validate from '../middlewares/validate.middleware.js';
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import AUDIT_LOGS from "../constants/audit-logs-action.constant.js";

const danhMucTinTucRouter = express.Router();

danhMucTinTucRouter.post("", 
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateDanhMucTinTucRequest),
    audit_logs(AUDIT_LOGS.CREATE, 'danh_muc_tin_tuc'),
    DanhMucTinTucController.create
);

danhMucTinTucRouter.put("/:id", 
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UpdateDanhMucTinTucRequest),
    audit_logs(AUDIT_LOGS.UPDATE, 'danh_muc_tin_tuc'),
    DanhMucTinTucController.update
);

danhMucTinTucRouter.delete("/:id", 
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.DELETE, 'danh_muc_tin_tuc'),
    DanhMucTinTucController.delete
);

danhMucTinTucRouter.put('/update-status/:id',
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.UPDATE, 'danh_muc_tin_tuc'),
    DanhMucTinTucController.updateStatus
);

danhMucTinTucRouter.get("", 
    DanhMucTinTucController.findAll
);

danhMucTinTucRouter.get("/pagination", 
    DanhMucTinTucController.findAllWithPagination
);

danhMucTinTucRouter.get("/:id", 
    DanhMucTinTucController.findById
);

export default danhMucTinTucRouter;