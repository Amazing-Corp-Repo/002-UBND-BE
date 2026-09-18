import Joi from "joi";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const UpdateLStatusLichTiepDanRequest = Joi.object({
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái hoạt động là bắt buộc',
        }),
});

export const CreateLichTiepDanRequest = Joi.object({
    diaDiem: Joi.string()
        .trim()
        .max(50)
        .required()
        .messages({
            'string.empty': 'Địa điểm tiếp dân không được để trống',
            'string.max': 'Địa điểm không được vượt quá 50 ký tự',
            'any.required': 'Địa điểm tiếp dân là bắt buộc',
        }),
    tenCanBo: Joi.string()
        .trim()
        .max(50)
        .required()
        .messages({
            'string.empty': 'Tên cán bộ không được để trống',
            'string.max': 'Tên cán bộ không được vượt quá 50 ký tự',
            'any.required': 'Tên cán bộ là bắt buộc',
        }),
    batDau: Joi.string()
        .pattern(timeRegex)
        .required()
        .messages({
            'string.pattern.base': 'Thời gian bắt đầu phải có dạng HH:mm (vd: 08:30)',
            'any.required': 'Thời gian bắt đầu là bắt buộc',
        }),

    ketThuc: Joi.string()
        .pattern(timeRegex)
        .required()
        .messages({
            'string.pattern.base': 'Thời gian kết thúc phải có dạng HH:mm (vd: 17:00)',
            'any.required': 'Thời gian kết thúc là bắt buộc',
        }),
    ngayTiepDan: Joi.date()
        .required()
        .messages({
            'date.base': 'Ngày tiếp dân không hợp lệ',
            'any.required': 'Ngày tiếp dân là bắt buộc',
        }),
    ghiChu: Joi.string()
        .trim()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Ghi chú phải là chuỗi ký tự',
            'string.max': 'Ghi chú không được vượt quá 255 ký tự',
        }),
});

export const UpdateLichTiepDanRequest = Joi.object({
    diaDiem: Joi.string()
        .trim()
        .max(50)
        .required()
        .messages({
            'string.empty': 'Địa điểm tiếp dân không được để trống',
            'string.max': 'Địa điểm không được vượt quá 50 ký tự',
            'any.required': 'Địa điểm tiếp dân là bắt buộc',
        }),
    tenCanBo: Joi.string()
        .trim()
        .max(50)
        .required()
        .messages({
            'string.empty': 'Tên cán bộ không được để trống',
            'string.max': 'Tên cán bộ không được vượt quá 50 ký tự',
            'any.required': 'Tên cán bộ là bắt buộc',
        }),
    batDau: Joi.string()
        .pattern(timeRegex)
        .required()
        .messages({
            'string.pattern.base': 'Thời gian bắt đầu phải có dạng HH:mm (vd: 08:30)',
            'any.required': 'Thời gian bắt đầu là bắt buộc',
        }),
    ketThuc: Joi.string()
        .pattern(timeRegex)
        .required()
        .messages({
            'string.pattern.base': 'Thời gian kết thúc phải có dạng HH:mm (vd: 17:00)',
            'any.required': 'Thời gian kết thúc là bắt buộc',
        }),
    ngayTiepDan: Joi.date()
        .required()
        .messages({
            'date.base': 'Ngày tiếp dân không hợp lệ',
            'any.required': 'Ngày tiếp dân là bắt buộc',
        }),
    ghiChu: Joi.string()
        .trim()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Ghi chú phải là chuỗi ký tự',
            'string.max': 'Ghi chú không được vượt quá 255 ký tự',
        }),
});
