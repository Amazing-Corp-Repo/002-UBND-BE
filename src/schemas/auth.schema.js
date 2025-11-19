import JoiToSwagger from 'joi-to-swagger';
import { ChangePasswordRequest, LoginRequest, LoginWithCaptchaRequest, LogoutRequest, RefreshTokenRequest, ResetPasswordRequest, SendOTPRequest, VerifyEnableOrDisable2FARequest, VerifyTwoFactorAuthRequest } from '../validators/auth.validator.js';

const { swagger: LoginRequestSchema } = JoiToSwagger(LoginRequest);
const { swagger: RefreshTokenRequestSchema } = JoiToSwagger(RefreshTokenRequest);
const { swagger: LogoutRequestSchema } = JoiToSwagger(LogoutRequest);
const { swagger: ChangePasswordRequestSchema } = JoiToSwagger(ChangePasswordRequest);
const { swagger: VerifyTwoFactorAuthRequestSchema } = JoiToSwagger(VerifyTwoFactorAuthRequest);
const { swagger: SendOTPRequestSchema } = JoiToSwagger(SendOTPRequest);
const { swagger: ResetPasswordRequestSchema } = JoiToSwagger(ResetPasswordRequest);
const { swagger: VerifyEnableOrDisable2FARequestSchema } = JoiToSwagger(VerifyEnableOrDisable2FARequest);
const { swagger: LoginWithCaptchaRequestSchema } = JoiToSwagger(LoginWithCaptchaRequest);

const AuthSchemas = {
    LoginRequest: LoginRequestSchema,
    RefreshTokenRequest: RefreshTokenRequestSchema,
    LogoutRequest: LogoutRequestSchema,
    ChangePasswordRequest: ChangePasswordRequestSchema,
    VerifyTwoFactorAuthRequest: VerifyTwoFactorAuthRequestSchema,
    SendOTPRequest: SendOTPRequestSchema,
    ResetPasswordRequest: ResetPasswordRequestSchema,
    VerifyEnableOrDisable2FARequest: VerifyEnableOrDisable2FARequestSchema,
    LoginWithCaptchaRequest: LoginWithCaptchaRequestSchema,
};

export default AuthSchemas;
