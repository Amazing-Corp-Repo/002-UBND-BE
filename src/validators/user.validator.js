import Joi from 'joi';

export const CreateAccountRequest = Joi.object({
    tenDangNhap: Joi.string()
        .required()
        .messages({
            'any.required': 'Tên đăng nhập không được để trống',
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email không hợp lệ',
            'any.required': 'Email là bắt buộc',
        }),
    matKhau: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
            'any.required': 'Mật khẩu là bắt buộc',
        }),
    vaiTro: Joi.string()
        .valid('ADMIN', 'NHAN_VIEN', 'LANH_DAO', 'PHO_CHU_TICH', 'CHU_TICH', 'KHU_PHO')
        .required()
        .messages({
            'any.only': 'Vai trò không hợp lệ',
            'any.required': 'Vai trò là bắt buộc',
        }),
});
