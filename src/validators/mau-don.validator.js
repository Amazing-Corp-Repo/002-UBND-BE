import Joi from "joi"; 

export const CreateMauDonRequest = Joi.object({
    tenMauDon: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên mẫu đơn không được vượt quá 255 ký tự',
            'any.required': 'Tên mẫu đơn là bắt buộc',
        }),
    moTa: Joi.string()
        .optional()
        .messages({
            'string.base': 'Mô tả phải là chuỗi ký tự',
        }),
});

export const UpdateMauDonRequest = Joi.object({
    tenMauDon: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên mẫu đơn không được vượt quá 255 ký tự',
            'any.required': 'Tên mẫu đơn là bắt buộc',
        }),
    moTa: Joi.string()
        .optional()
        .messages({
            'string.base': 'Mô tả phải là chuỗi ký tự',
        }),
    isRemoved: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'isRemoved phải là kiểu boolean',
        }),
});