import express from "express";
import CoSoDichVuCongController from "../controllers/co-so-dich-vu-cong.controller.js";
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import ROLE from '../constants/role.constant.js';
import { CreateCoSoDichVuCongRequest, UpdateCoSoDichVuCongRequest, UpdateStatusCoSoDichVuCongRequest } from "../validators/co-so-dich-vu-cong.validator.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import AUDIT_LOGS from "../constants/audit-logs-action.constant.js";

const coSoDichVuCongRoute = express.Router();

coSoDichVuCongRoute.get(
    "",
    CoSoDichVuCongController.getAll
);

coSoDichVuCongRoute.get(
    "/pagination",
    CoSoDichVuCongController.getAllWithPagination
);

coSoDichVuCongRoute.post(
    "",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateCoSoDichVuCongRequest),
    audit_logs(AUDIT_LOGS.CREATE, 'co_so_dich_vu_cong'),
    CoSoDichVuCongController.create
);

coSoDichVuCongRoute.put(
    "/update-status/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UpdateStatusCoSoDichVuCongRequest),
    audit_logs(AUDIT_LOGS.UPDATE, 'co_so_dich_vu_cong'),
    CoSoDichVuCongController.updateStatus
);

coSoDichVuCongRoute.get(
    "/:id",
    CoSoDichVuCongController.findById
);

coSoDichVuCongRoute.put(
    "/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UpdateCoSoDichVuCongRequest),
    audit_logs(AUDIT_LOGS.UPDATE, 'co_so_dich_vu_cong'),
    CoSoDichVuCongController.update
);

coSoDichVuCongRoute.delete(
    "/:id",
    authenticate,
    authorize([ROLE.ADMIN]),
    audit_logs(AUDIT_LOGS.DELETE, 'co_so_dich_vu_cong'),
    CoSoDichVuCongController.delete
);

export default coSoDichVuCongRoute;