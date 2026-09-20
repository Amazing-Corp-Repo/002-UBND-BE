import Joi from "joi";

export const CreateMauDonRequest = Joi.object({
    tenMauDon: Joi.string()
        .trim()
        .max(200)
        .required()
        .messages({
            'string.max': 'Tên mẫu đơn không được vượt quá 200 ký tự',
            'any.required': 'Tên mẫu đơn là bắt buộc',
        }),
    moTa: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Mô tả phải là chuỗi ký tự',
        }),
    maMauDon: Joi.string()
        .trim()
        .max(45)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Mã mẫu đơn không được vượt quá 45 ký tự',
        }),
});

export const UpdateMauDonRequest = Joi.object({
    tenMauDon: Joi.string()
        .trim()
        .max(200)
        .required()
        .messages({
            'string.max': 'Tên mẫu đơn không được vượt quá 200 ký tự',
            'any.required': 'Tên mẫu đơn là bắt buộc',
        }),
    moTa: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Mô tả phải là chuỗi ký tự',
        }),
    maMauDon: Joi.string()
        .trim()
        .max(45)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Mã mẫu đơn không được vượt quá 45 ký tự',
        }),
});

export const UpdateStatusMauDonRequest = Joi.object({
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái hoạt động là bắt buộc',
        }),
});

export const GetMauDonPagingQuery = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    size: Joi.number().integer().min(1).max(100).default(10),
    isActive: Joi.boolean().truthy('true').falsy('false').optional(),
    search: Joi.string().trim().max(255).allow('').optional(),
});
