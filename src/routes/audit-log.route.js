import express from 'express';
import AuditLogController from '../controllers/aduit-log.controller.js';
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const auditLogRouter = express.Router();

auditLogRouter.get(
    '/', 
    authenticate,
    authorize([PERMISSION.ADL_GET_ALL]),
    AuditLogController.getAuditLogs
);

auditLogRouter.get(
    '/:id', 
    authenticate,
    authorize([PERMISSION.ADL_GET_DETAIL]),
    AuditLogController.getAuditLogById
);

export default auditLogRouter;