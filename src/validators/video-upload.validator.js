import Joi from "joi";

export const MAX_VIDEO_SIZE_BYTES = 150 * 1024 * 1024;

export const VideoUploadRequest = Joi.object({
    idVideo: Joi.string()
        .trim()
        .uuid()
        .required()
        .messages({
            'string.guid': 'ID video không hợp lệ',
            'any.required': 'ID video là bắt buộc',
        }),
    currentIndex: Joi.number()
        .integer()
        .min(0)
        .less(Joi.ref('totalChunks'))
        .required()
        .messages({
            'number.base': 'Chỉ số hiện tại phải là một số nguyên',
            'number.min': 'Chỉ số hiện tại không được nhỏ hơn 0',
            'number.less': 'Chỉ số hiện tại phải nhỏ hơn tổng số phần',
            'any.required': 'Chỉ số hiện tại là bắt buộc',
        }),
    totalChunks: Joi.number()
        .integer()
        .min(1)
        .max(150)
        .required()
        .messages({
            'number.base': 'Tổng số phần phải là một số nguyên',
            'number.min': 'Tổng số phần phải lớn hơn hoặc bằng 1',
            'number.max': 'Video không được vượt quá 150 MB',
            'any.required': 'Tổng số phần là bắt buộc',
        }),
    totalSize: Joi.number()
        .integer()
        .min(1)
        .max(MAX_VIDEO_SIZE_BYTES)
        .required()
        .messages({
            'number.base': 'Dung lượng video phải là một số nguyên',
            'number.min': 'Dung lượng video phải lớn hơn 0',
            'number.max': 'Video không được vượt quá 150 MB',
            'any.required': 'Dung lượng video là bắt buộc',
        }),
});

export const VideoUploadParams = Joi.object({
    idVideo: Joi.string().trim().uuid().required().messages({
        'string.guid': 'ID video không hợp lệ',
        'any.required': 'ID video là bắt buộc',
    }),
});
