import Joi from "joi";

export const CreateLinhVucRequest = Joi.object({
    ten_linh_vuc: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên lĩnh vực không được vượt quá 255 ký tự',
            'any.required': 'Tên lĩnh vực là bắt buộc',
        }),
    mo_ta: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Mô tả phải là chuỗi ký tự',
        }),
});

export const UpdateLinhVucRequest = Joi.object({
    ten_linh_vuc: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên lĩnh vực không được vượt quá 255 ký tự',
            'any.required': 'Tên lĩnh vực là bắt buộc',
        }),
    mo_ta: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Mô tả phải là chuỗi ký tự',
        }),
    is_remove: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'is_remove phải là kiểu boolean',
        }),
});