import express from "express";
import validate from "../middlewares/validate.middleware.js";
import {
  ChangePasswordRequest,
  LoginRequest,
  LoginWithCaptchaRequest,
  LogoutRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
  SendOTPRequest,
  VerifyEnableOrDisable2FARequest,
  VerifyTwoFactorAuthRequest,
} from "../validators/auth.validator.js";
import AuthController from "../controllers/auth.controller.js";
import { clientInfo } from "../middlewares/client-info.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { audit_logs } from "../middlewares/audit-logs.middleware.js";
import { AUDIT_LOG_ACTIONS, AUDIT_LOGS } from "../constants/audit-logs-action.constant.js";

const authRoute = express.Router();

authRoute.post(
  "/login",
  validate(LoginRequest),
  clientInfo,
  AuthController.login
);
authRoute.post(
  "/logout",
  validate(LogoutRequest),
  clientInfo,
  AuthController.logout
);
authRoute.put(
  "/refresh-token",
  validate(RefreshTokenRequest),
  clientInfo,
  AuthController.refreshToken
);

authRoute.put(
  "/change-password",
  authenticate,
  validate(ChangePasswordRequest),
  audit_logs(AUDIT_LOGS.UPDATE, AUDIT_LOG_ACTIONS.CHANGE_PASSWORD),
  AuthController.changePassword
);

authRoute.put(
  "/reset-password",
  validate(ResetPasswordRequest),
  clientInfo,
  AuthController.resetPassword
);

authRoute.post(
  "/enable-or-disable-2fa",
  authenticate,
  clientInfo,
  audit_logs(AUDIT_LOGS.UPDATE, AUDIT_LOG_ACTIONS.ENABLE_OR_DISABLE_2FA),
  AuthController.enableOrDisableTwoFactorAuth
);
authRoute.post(
  "/verify-enable-or-disable-2fa",
  authenticate,
  validate(VerifyEnableOrDisable2FARequest),
  AuthController.verifyEnableOrDisable2FA
);
authRoute.post(
  "/verify-2fa",
  validate(VerifyTwoFactorAuthRequest),
  clientInfo,
  AuthController.verifyTwoFactorAuth
);

authRoute.post("/send-otp", validate(SendOTPRequest), AuthController.sendOTP);
authRoute.post(
  "/login-with-captcha",
  validate(LoginWithCaptchaRequest),
  clientInfo,
  AuthController.loginWithCaptcha
);

export default authRoute;
