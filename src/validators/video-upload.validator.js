import Joi from "joi";

export const VideoUploadRequest = Joi.object({
    idVideo: Joi.string()
        .trim()
        .required()
        .messages({
            'any.required': 'ID video là bắt buộc',
        }),
    currentIndex: Joi.number()
        .integer()
        .min(0)
        .required()
        .messages({
            'number.base': 'Chỉ số hiện tại phải là một số nguyên',
            'number.min': 'Chỉ số hiện tại không được nhỏ hơn 0',
            'any.required': 'Chỉ số hiện tại là bắt buộc',
        }),
    totalChunks: Joi.number()
        .integer()
        .min(2)
        .required()
        .messages({
            'number.base': 'Tổng số phần phải là một số nguyên',
            'number.min': 'Tổng số phần phải lớn hơn 1',
            'any.required': 'Tổng số phần là bắt buộc',
        }),
});