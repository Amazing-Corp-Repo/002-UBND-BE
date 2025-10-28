import Joi from "joi";
import  TIN_TUC from "../constants/tin-tuc.constant.js";

export const UploadFileDinhKemRequest = Joi.object({
    idTinTuc: Joi.string()
        .optional()
});

export const UpdateTinTucRequest = Joi.object({
    idDanhMuc: Joi.string()
        .uuid()
        .required()
        .messages({
            'any.required': 'ID danh mục là bắt buộc',
            'string.uuid': 'ID danh mục không hợp lệ'
        }),
    tieuDe: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tiêu đề không được vượt quá 255 ký tự',
            'any.required': 'Tiêu đề là bắt buộc'
        }),
    noiDung: Joi.string()
        .required()
        .messages({
            'any.required': 'Nội dung là bắt buộc'
        }),
    trangThai: Joi.string()
        .valid(...Object.values(TIN_TUC))
        .required()
        .messages({
            'any.required': 'Trạng thái là bắt buộc',
            'any.only': `Trạng thái không hợp lệ, giá trị hợp lệ: ${Object.values(TIN_TUC).join(', ')}`
        }),
    tacGia: Joi.string()
        .max(255)
        .optional()
        .messages({
            'string.max': 'Tác giả không được vượt quá 255 ký tự'
        }),
    isRemoved: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái isRemoved là bắt buộc'
        })
});

export const CreateTinTucRequest = Joi.object({
    idDanhMuc: Joi.string()
        .uuid()
        .required()
        .messages({
            'any.required': 'ID danh mục là bắt buộc',
            'string.uuid': 'ID danh mục không hợp lệ'
        }),
    tieuDe: Joi.string()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tiêu đề không được vượt quá 255 ký tự',
            'any.required': 'Tiêu đề là bắt buộc'
        }),
    noiDung: Joi.string()
        .required()
        .messages({
            'any.required': 'Nội dung là bắt buộc'
        }),
    trangThai: Joi.string()
        .valid(...Object.values(TIN_TUC))
        .required()
        .messages({
            'any.required': 'Trạng thái là bắt buộc',
            'any.only': `Trạng thái không hợp lệ, giá trị hợp lệ: ${Object.values(TIN_TUC).join(', ')}`
        }),
    tacGia: Joi.string()
        .max(255)
        .optional()
        .messages({
            'string.max': 'Tác giả không được vượt quá 255 ký tự'
        })
});