import Joi from 'joi';

export const CreateDanhMucTinTucRequest = Joi.object({
    tenDanhMuc: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên danh mục không được vượt quá 255 ký tự',
            'any.required': 'Tên danh mục là bắt buộc'
        }),
    moTa: Joi.string()
        .optional()
});

export const UpdateDanhMucTinTucRequest = Joi.object({
    tenDanhMuc: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên danh mục không được vượt quá 255 ký tự',
            'any.required': 'Tên danh mục là bắt buộc'
        }),
    moTa: Joi.string()
        .optional(),
    isRemoved: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái isRemoved là bắt buộc'
        })
});