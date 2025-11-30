import express from "express";
import {
  authenticate,
  authorize,
  logAuthMiddleware,
} from "../middlewares/auth.middleware.js";
import UserController from "../controllers/user.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  CreateAccountRequest,
  CreateAdminAccountRequest,
  UpdateProfileByAdminRequest,
  UpdateProfileRequest,
  UpdateStatusByAdminRequest,
} from "../validators/user.validator.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOGS, AUDIT_LOG_ACTIONS } from "../constants/audit-logs-action.constant.js";
import { PERMISSION, PERMISSION_DESC } from "../constants/permission.constant.js";

const userRoute = express.Router();

userRoute.get("/my-profile", authenticate, UserController.getMyProfile);

userRoute.get("", authenticate, UserController.getAllUsers);

userRoute.post(
  "/create-account",
  authenticate,
  authorize([PERMISSION.ND_CREATE]),
  validate(CreateAccountRequest),
  audit_logs(AUDIT_LOGS.CREATE, PERMISSION_DESC.ND_CREATE),
  UserController.createAccount
);

userRoute.put(
  "",
  authenticate,
  validate(UpdateProfileRequest),
  audit_logs(AUDIT_LOGS.UPDATE, AUDIT_LOG_ACTIONS.UPDATE_PROFILE),
  UserController.updateProfile
);

userRoute.put(
  "/update-by-admin",
  authenticate,
  authorize([PERMISSION.ND_UPDATE]),
  validate(UpdateProfileByAdminRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.ND_UPDATE),
  UserController.updateProfileByAdmin
);
userRoute.put(
  "/update-status/:userId",
  authenticate,
  authorize([PERMISSION.ND_UPDATE_STATUS]),
  validate(UpdateStatusByAdminRequest),
  audit_logs(AUDIT_LOGS.UPDATE, PERMISSION_DESC.ND_UPDATE_STATUS),
  UserController.updateStatusByAdmin
);

userRoute.delete(
  "/:userId",
  authenticate,
  authorize([PERMISSION.ND_DELETE]),
  audit_logs(AUDIT_LOGS.DELETE, PERMISSION_DESC.ND_DELETE),
  UserController.deleteUser
);

userRoute.put(
  "/fcm-token",
  authenticate,
  audit_logs(AUDIT_LOGS.UPDATE, AUDIT_LOG_ACTIONS.UPDATE_PROFILE),
  UserController.updateFcmToken
);

userRoute.get(
  "/:id",
  authenticate,
  authorize([PERMISSION.ND_GET]),
  UserController.getUserById
);

userRoute.post(
  "/create-admin-account",
  logAuthMiddleware,
  validate(CreateAdminAccountRequest),
  UserController.createAdminAccount
);
export default userRoute;
