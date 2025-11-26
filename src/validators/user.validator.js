import Joi from 'joi';

export const CreateAccountRequest = Joi.object({
    tenDangNhap: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'Tên đăng nhập không được để trống',
        }),
    email: Joi.string()
        .trim()
        .email()
        .max(100)
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc',
            'string.max': 'Email không được vượt quá 100 ký tự',
        }),
    matKhau: Joi.string()
        .trim()
        .min(6)
        .max(255)
        .required()
        .messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu là bắt buộc',
        }),
    vaiTro: Joi.string()
        .trim()
        .required()
        .uuid()
        .messages({
            'any.required': 'Vai trò là bắt buộc',
            'string.uuid': 'Vai trò không hợp lệ',
        }),
});

export const UpdateProfileRequest = Joi.object({
    hoVaTen: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'Họ và tên không được để trống',
        }),
    soDienThoai: Joi.string()
        .trim()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ',
            'any.required': 'Số điện thoại là bắt buộc',
        }),
});

export const UpdateProfileByAdminRequest = Joi.object({
    userId: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'User ID không được để trống',
        }),
    hoVaTen: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'Họ và tên không được để trống',
        }),
    soDienThoai: Joi.string()
        .trim()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ',
            'any.required': 'Số điện thoại là bắt buộc',
        }),
    vaiTro: Joi.string()
        .trim()
        .uuid()
        .required()
        .messages({
            'any.required': 'Vai trò là bắt buộc',
            'string.uuid': 'Vai trò không hợp lệ',
        }),
    tenDangNhap: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'Tên đăng nhập không được để trống',
        }),
    email: Joi.string()
        .trim()
        .email()
        .max(100)
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc',
            'string.max': 'Email không được vượt quá 100 ký tự',
        }),
    matKhau: Joi.string()
        .trim()
        .min(6)
        .max(255)
        .allow(null, '')
        .messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        }),
});

export const UpdateStatusByAdminRequest = Joi.object({
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái hoạt động là bắt buộc',
        }),
});

export const UpdateFcmTokenRequest = Joi.object({
    fcmToken: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'FCM token là bắt buộc',
        }),
});

export const CreateAdminAccountRequest = Joi.object({
    tenDangNhap: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'Tên đăng nhập không được để trống',
        }),
    email: Joi.string()
        .trim()
        .email()
        .max(100)
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc',
            'string.max': 'Email không được vượt quá 100 ký tự',
        }),
    matKhau: Joi.string()
        .trim()
        .min(6)
        .max(255)
        .required()
        .messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu là bắt buộc',
        }),
});