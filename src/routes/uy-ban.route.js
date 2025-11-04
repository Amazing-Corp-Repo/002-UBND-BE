import express from "express";
import UyBanController from "../controllers/uy-ban.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import ROLE from "../constants/role.constant.js";
import validate from "../middlewares/validate.middleware.js";
import { CreateUyBanRequest, UpdateUyBanRequest } from "../validators/uy-ban.validator.js";
import { audit_logs } from '../middlewares/audit-logs.middleware.js';
import AUDIT_LOGS from '../constants/audit-logs-action.constant.js';

const uyBanRouter = express.Router();

uyBanRouter.post(
    "/",
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateUyBanRequest),
    audit_logs(AUDIT_LOGS.CREATE, 'uy_ban'),
    UyBanController.create
);
uyBanRouter.get("/", UyBanController.getFrist);

uyBanRouter.put(
    "/:id", 
    authenticate, 
    authorize([ROLE.ADMIN]), 
    validate(UpdateUyBanRequest), 
    audit_logs(AUDIT_LOGS.UPDATE, 'uy_ban'),
    UyBanController.update
);

export default uyBanRouter;