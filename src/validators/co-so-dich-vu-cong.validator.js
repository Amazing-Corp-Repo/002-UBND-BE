import Joi from "joi";

export const CreateCoSoDichVuCongRequest = Joi.object({
    idUyBan: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required()
        .messages({
            'string.guid': 'ID Ủy ban không hợp lệ (phải là UUID v4)',
            'any.required': 'ID Ủy ban là bắt buộc',
        }),
    tenCoSo: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên cơ sở không được vượt quá 255 ký tự',
            'any.required': 'Tên cơ sở là bắt buộc',
        }),
    diaChi: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
        }),
    soDienThoai: Joi.string()
        .optional()
        .messages({
            'string.pattern.base': 'Số điện thoại phải là chuỗi số từ 10 đến 20 ký tự',
        }),
    moTa: Joi.string()
        .optional()
        .messages({
            'string.base': 'Mô tả phải là chuỗi',
        }),
    linkGoogleMap: Joi.string()
        .uri()
        .max(500)
        .optional()
        .messages({
            'string.uri': 'Link Google Map không hợp lệ',
            'string.max': 'Link Google Map không được vượt quá 500 ký tự',
        }),
});

export const UpdateCoSoDichVuCongRequest = Joi.object({
    idUyBan: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required()
        .messages({
            'string.guid': 'ID Ủy ban không hợp lệ (phải là UUID v4)',
            'any.required': 'ID Ủy ban là bắt buộc',
        }),
    tenCoSo: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên cơ sở không được vượt quá 255 ký tự',
            'any.required': 'Tên cơ sở là bắt buộc',
        }),
    diaChi: Joi.string()
        .max(500)
        .optional()
        .messages({
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
        }),
    soDienThoai: Joi.string()
        .optional()
        .messages({
            'string.pattern.base': 'Số điện thoại phải là chuỗi số từ 10 đến 20 ký tự',
        }),
    moTa: Joi.string()
        .optional()
        .messages({
            'string.base': 'Mô tả phải là chuỗi',
        }),
    linkGoogleMap: Joi.string()
        .uri()
        .max(500)
        .optional()
        .messages({
            'string.uri': 'Link Google Map không hợp lệ',
            'string.max': 'Link Google Map không được vượt quá 500 ký tự',
        }),
    isRemoved: Joi.boolean()
        .messages({
            'boolean.base': 'isRemoved phải là kiểu boolean',
        }),
});