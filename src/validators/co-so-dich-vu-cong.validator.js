import Joi from "joi";

export const CreateCoSoDichVuCongRequest = Joi.object({
    tenCoSo: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên cơ sở không được vượt quá 255 ký tự',
            'any.required': 'Tên cơ sở là bắt buộc',
        }),
    diaChi: Joi.string()
        .trim()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
        }),
    soDienThoai: Joi.string()
        .trim()
        .pattern(/^[0-9]{10,15}$/)
        .allow(null, '')
        .optional()
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ',
        }),
    moTa: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Mô tả phải là chuỗi',
        }),
    linkGoogleMap: Joi.string()
        .trim()
        .uri()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
            'string.uri': 'Link Google Map không hợp lệ',
            'string.max': 'Link Google Map không được vượt quá 500 ký tự',
        }),
});

export const UpdateCoSoDichVuCongRequest = Joi.object({
    tenCoSo: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên cơ sở không được vượt quá 255 ký tự',
            'any.required': 'Tên cơ sở là bắt buộc',
        }),
    diaChi: Joi.string()
        .trim()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
        }),
    soDienThoai: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Số điện thoại phải là chuỗi số từ 10 đến 20 ký tự',
        }),
    moTa: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Mô tả phải là chuỗi',
        }),
    linkGoogleMap: Joi.string()
        .trim()
        .uri()
        .max(500)
        .optional()
        .allow(null, '')
        .messages({
            'string.uri': 'Link Google Map không hợp lệ',
            'string.max': 'Link Google Map không được vượt quá 500 ký tự',
        }),
});

export const UpdateStatusCoSoDichVuCongRequest = Joi.object({
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái hoạt động là bắt buộc',
        }),
});