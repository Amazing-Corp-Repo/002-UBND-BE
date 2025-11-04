import Joi from "joi";

export const CreateMauDonRequest = Joi.object({
    tenMauDon: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên mẫu đơn không được vượt quá 255 ký tự',
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
        .max(50)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Mã mẫu đơn không được vượt quá 50 ký tự',
        }),
});

export const UpdateMauDonRequest = Joi.object({
    tenMauDon: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên mẫu đơn không được vượt quá 255 ký tự',
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
        .max(50)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Mã mẫu đơn không được vượt quá 50 ký tự',
        }),
});

export const UpdateStatusMauDonRequest = Joi.object({
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái hoạt động là bắt buộc',
        }),
});