import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import UserController from '../controllers/user.controller.js';
import ROLE from '../constants/role.constant.js';
import validate from '../middlewares/validate.middleware.js';
import { CreateAccountRequest, UpdateProfileByAdminRequest, UpdateProfileRequest, UpdateStatusByAdminRequest } from '../validators/user.validator.js';
import { audit_logs } from '../middlewares/audit-logs.middleware.js';
import AUDIT_LOGS from '../constants/audit-logs-action.constant.js';


const userRoute = express.Router();

userRoute.get(
    '/my-profile',
    authenticate,
    UserController.getMyProfile
);

userRoute.get(
    '',
    authenticate,
    UserController.getAllUsers
);

userRoute.post(
    '/create-account',
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(CreateAccountRequest),
    audit_logs(AUDIT_LOGS.CREATE, 'nguoi_dung'),
    UserController.createAccount
);

userRoute.put(
    '',
    authenticate,
    validate(UpdateProfileRequest),
    audit_logs(AUDIT_LOGS.UPDATE, 'nguoi_dung'),
    UserController.updateProfile
);

userRoute.put(
    '/update-by-admin',
    authenticate,
    authorize([ROLE.ADMIN]),
    validate(UpdateProfileByAdminRequest),
    audit_logs(AUDIT_LOGS.UPDATE, 'nguoi_dung'),
    UserController.updateProfileByAdmin
);
userRoute.put(
    '/update-status/:userId', 
    authenticate, 
    authorize([ROLE.ADMIN]),
    validate(UpdateStatusByAdminRequest),
    audit_logs(AUDIT_LOGS.UPDATE, 'nguoi_dung'), 
    UserController.updateStatusByAdmin
);

userRoute.delete(
    '/:userId', 
    authenticate, 
    authorize([ROLE.ADMIN]), 
    audit_logs(AUDIT_LOGS.DELETE, 'nguoi_dung'),
    UserController.deleteUser
);

userRoute.put(
    '/fcm-token', 
    authenticate, 
    audit_logs(AUDIT_LOGS.UPDATE, 'nguoi_dung'),
    UserController.updateFcmToken
);

userRoute.get(
    '/:id',
    authenticate,
    authorize([ROLE.ADMIN]),
    UserController.getUserById
);

export default userRoute;