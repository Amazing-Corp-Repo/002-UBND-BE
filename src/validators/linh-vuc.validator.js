import Joi from "joi";

export const CreateLinhVucRequest = Joi.object({
    tenLinhVuc: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên lĩnh vực không được vượt quá 255 ký tự',
            'any.required': 'Tên lĩnh vực là bắt buộc',
        }),
    moTa: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Mô tả phải là chuỗi ký tự',
        }),
});

export const UpdateLinhVucRequest = Joi.object({
    tenLinhVuc: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên lĩnh vực không được vượt quá 255 ký tự',
            'any.required': 'Tên lĩnh vực là bắt buộc',
        }),
    moTa: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Mô tả phải là chuỗi ký tự',
        }),
});

export const UpdateLinhVucStatusRequest = Joi.object({
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái hoạt động là bắt buộc',
        }),
});