import Joi from 'joi';

export const CreateDanhMucTinTucRequest = Joi.object({
    tenDanhMuc: Joi.string()
        .trim()
        .pattern(/^[^<>]*$/)
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên danh mục không được vượt quá 255 ký tự',
            'string.pattern.base': 'Tên danh mục không được chứa thẻ HTML',
            'any.required': 'Tên danh mục là bắt buộc'
        }),
    moTa: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
});

export const UpdateDanhMucTinTucRequest = Joi.object({
    tenDanhMuc: Joi.string()
        .trim()
        .pattern(/^[^<>]*$/)
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên danh mục không được vượt quá 255 ký tự',
            'string.pattern.base': 'Tên danh mục không được chứa thẻ HTML',
            'any.required': 'Tên danh mục là bắt buộc'
        }),
    moTa: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
});

export const UpdateStatusDanhMucTinTucRequest = Joi.object({
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái hoạt động là bắt buộc',
        }),
});
