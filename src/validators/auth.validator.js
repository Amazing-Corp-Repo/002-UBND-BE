import Joi from 'joi';

export const LoginRequest = Joi.object({
    tenDangNhap: Joi.string()
        .required()
        .messages({
            'any.required': 'Tên đăng nhập là bắt buộc',
        }),
    matKhau: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu là bắt buộc',
        }),
});

export const RefreshTokenRequest = Joi.object({
    refreshToken: Joi.string()
        .required()
        .messages({
            'any.required': 'Refresh token là bắt buộc',
        }),
});

export const LogoutRequest = Joi.object({
    refreshToken: Joi.string()
        .required()
        .messages({
            'any.required': 'Refresh token là bắt buộc',
        }),
});

export const ChangePasswordRequest = Joi.object({
    matKhauHienTai: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Mật khẩu hiện tại phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu hiện tại là bắt buộc',
        }),
    matKhauMoi: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu mới là bắt buộc',
        }),
});

export const VerifyTwoFactorAuthRequest = Joi.object({
    otp: Joi.string()
        .length(6)
        .required()
        .messages({
            'string.length': 'OTP phải có đúng 6 ký tự',
            'any.required': 'OTP là bắt buộc',
        }),
    tenDangNhap: Joi.string()
        .required()
        .messages({
            'any.required': 'Tên đăng nhập là bắt buộc',
        }),
});

export const SendOTPRequest = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc',
        }),
});

export const ResetPasswordRequest = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc',
        }),
    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu mới là bắt buộc',
        }),
    otp: Joi.string()
        .length(6)
        .required()
        .messages({
            'string.length': 'OTP phải có đúng 6 ký tự',
            'any.required': 'OTP là bắt buộc',
        }),
});

export const VerifyEnableOrDisable2FARequest = Joi.object({
    otp: Joi.string()
        .length(6)
        .required()
        .messages({
            'string.length': 'OTP phải có đúng 6 ký tự',
            'any.required': 'OTP là bắt buộc',
        }),
});