import Joi from "joi";

export const CreateUyBanRequest = Joi.object({
    tenDonVi: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên ủy ban không được vượt quá 255 ký tự',
            'any.required': 'Tên ủy ban là bắt buộc',
        }),
    diaChi: Joi.string()
        .max(500)
        .required()
        .messages({
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
            'any.required': 'Địa chỉ là bắt buộc',
        }),
    soDienThoai: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Số điện thoại phải từ 10 đến 15 chữ số',
            'any.required': 'Số điện thoại là bắt buộc',
        }),
    email: Joi.string()
        .email()
        .messages({
            'string.email': 'Email không hợp lệ',
        }),
    gioLamViec: Joi.string()
        .max(100)
        .required()
        .messages({
            'string.max': 'Giờ làm việc không được vượt quá 100 ký tự',
            'any.required': 'Giờ làm việc là bắt buộc',
        }),
    linkGoogleMap: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.uri': 'Link Google Map không hợp lệ',
        }),
});

export const UpdateUyBanRequest = Joi.object({
    tenDonVi: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên ủy ban không được vượt quá 255 ký tự',
            'any.required': 'Tên ủy ban là bắt buộc',
        }),
    diaChi: Joi.string()
        .max(500)
        .required()
        .messages({
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
            'any.required': 'Địa chỉ là bắt buộc',
        }),
    soDienThoai: Joi.string()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Số điện thoại phải từ 10 đến 15 chữ số',
            'any.required': 'Số điện thoại là bắt buộc',
        }),
    email: Joi.string()
        .email()
        .messages({
            'string.email': 'Email không hợp lệ',
        }),
    gioLamViec: Joi.string()
        .max(100)
        .required()
        .messages({
            'string.max': 'Giờ làm việc không được vượt quá 100 ký tự',
            'any.required': 'Giờ làm việc là bắt buộc',
        }),
    linkGoogleMap: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.uri': 'Link Google Map không hợp lệ',
        }),
});