import express from 'express';
import validate from '../middlewares/validate.middleware.js';
import { ChangePasswordRequest, LoginRequest, LogoutRequest, RefreshTokenRequest, ResetPasswordRequest, SendOTPRequest, VerifyEnableOrDisable2FARequest, VerifyTwoFactorAuthRequest } from '../validators/auth.validator.js';
import AuthController from '../controllers/auth.controller.js';
import { clientInfo } from '../middlewares/client-info.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const authRoute = express.Router();

authRoute.post('/login', validate(LoginRequest), clientInfo, AuthController.login);
authRoute.post('/logout', validate(LogoutRequest), clientInfo, AuthController.logout);
authRoute.put('/refresh-token', validate(RefreshTokenRequest), clientInfo, AuthController.refreshToken);

authRoute.put('/change-password', authenticate, validate(ChangePasswordRequest), AuthController.changePassword);
authRoute.put('/reset-password', validate(ResetPasswordRequest), clientInfo, AuthController.resetPassword);

authRoute.post('/enable-or-disable-2fa', authenticate, clientInfo, AuthController.enableOrDisableTwoFactorAuth);
authRoute.post('/verify-enable-or-disable-2fa', authenticate, validate(VerifyEnableOrDisable2FARequest), AuthController.verifyEnableOrDisable2FA);
authRoute.post('/verify-2fa', validate(VerifyTwoFactorAuthRequest), clientInfo, AuthController.verifyTwoFactorAuth);

authRoute.post('/send-otp', validate(SendOTPRequest), AuthController.sendOTP);

authRoute.get('/test', authenticate, (req, res) => {
    res.json({ message: 'Authenticated access granted' });
});

export default authRoute;