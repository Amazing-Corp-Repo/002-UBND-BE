import Joi from "joi";
import TIN_TUC from "../constants/tin-tuc.constant.js";

export const UploadFileDinhKemRequest = Joi.object({
    idTinTuc: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
});

export const UpdateTinTucRequest = Joi.object({
    idDanhMuc: Joi.string()
        .trim()
        .uuid()
        .required()
        .messages({
            'any.required': 'ID danh mục là bắt buộc',
            'string.uuid': 'ID danh mục không hợp lệ'
        }),
    tieuDe: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tiêu đề không được vượt quá 255 ký tự',
            'any.required': 'Tiêu đề là bắt buộc'
        }),
    noiDung: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'Nội dung là bắt buộc'
        }),
    tacGia: Joi.string()
        .trim()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Tác giả không được vượt quá 255 ký tự'
        }),
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái isActive là bắt buộc'
        })
});

export const CreateTinTucRequest = Joi.object({
    idDanhMuc: Joi.string()
        .trim()
        .uuid()
        .required()
        .messages({
            'any.required': 'ID danh mục là bắt buộc',
            'string.uuid': 'ID danh mục không hợp lệ'
        }),
    tieuDe: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tiêu đề không được vượt quá 255 ký tự',
            'any.required': 'Tiêu đề là bắt buộc'
        }),
    noiDung: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'Nội dung là bắt buộc'
        }),
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái isActive là bắt buộc'
        }),
    tacGia: Joi.string()
        .trim()
        .max(255)
        .optional()
        .messages({
            'string.max': 'Tác giả không được vượt quá 255 ký tự'
        })
});

export const UpdateStatusTinTucRequest = Joi.object({
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái isActive là bắt buộc'
        })
});