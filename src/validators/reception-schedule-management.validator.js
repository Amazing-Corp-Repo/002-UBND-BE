import Joi from "joi";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const calendarDateSchema = (fieldLabel) =>
    Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .custom((value, helpers) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return value;
            }
            const date = new Date(`${value}T00:00:00.000Z`);
            if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
                return helpers.error('date.invalid');
            }
            return value;
        })
        .messages({
            'string.pattern.base': `${fieldLabel} phải có định dạng YYYY-MM-DD`,
            'date.invalid': `${fieldLabel} không tồn tại`,
        });

const rejectMixedTimeConfiguration = (value, helpers) => {
    if (value.workingPeriods && (value.batDau || value.ketThuc)) {
        return helpers.error('object.timeConfigurationConflict');
    }
    return value;
};

const WorkingPeriodSchema = Joi.object({
    startTime: Joi.string().pattern(timeRegex).required().messages({
        'string.pattern.base': 'Giờ bắt đầu phải có dạng HH:mm',
        'any.required': 'Giờ bắt đầu của khoảng làm việc là bắt buộc',
    }),
    endTime: Joi.string().pattern(timeRegex).required().messages({
        'string.pattern.base': 'Giờ kết thúc phải có dạng HH:mm',
        'any.required': 'Giờ kết thúc của khoảng làm việc là bắt buộc',
    }),
});
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
        .max(255)
        .required()
        .messages({
            'string.max': 'Địa điểm không được vượt quá 255 ký tự',
            'any.required': 'Địa điểm là bắt buộc',
        }),
    tenCanBo: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên cán bộ không được vượt quá 255 ký tự',
            'any.required': 'Tên cán bộ là bắt buộc',
        }),
    batDau: Joi.string()
        .pattern(timeRegex)
        .optional()
        .messages({
            'string.pattern.base': 'Thời gian bắt đầu phải có dạng HH:mm (vd: 08:30)',
        }),

    ketThuc: Joi.string()
        .pattern(timeRegex)
        .optional()
        .messages({
            'string.pattern.base': 'Thời gian kết thúc phải có dạng HH:mm (vd: 17:00)',
        }),
    workingPeriods: Joi.array()
        .items(WorkingPeriodSchema)
        .min(1)
        .max(2)
        .optional()
        .messages({
            'array.min': 'Phải có ít nhất một khoảng làm việc',
            'array.max': 'Chỉ hỗ trợ tối đa hai khoảng làm việc trong ngày',
        }),
    ngayTiepDan: calendarDateSchema('Ngày tiếp dân')
        .required()
        .messages({
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
}).and('batDau', 'ketThuc').custom(rejectMixedTimeConfiguration).messages({
    'object.and': 'Thời gian bắt đầu và kết thúc phải được truyền cùng nhau',
    'object.timeConfigurationConflict': 'Chỉ được dùng workingPeriods hoặc cặp batDau/ketThuc',
});
export const UpdateLichTiepDanRequest = Joi.object({
    diaDiem: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Địa điểm không được vượt quá 255 ký tự',
            'any.required': 'Địa điểm là bắt buộc',
        }),
    tenCanBo: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên cán bộ không được vượt quá 255 ký tự',
            'any.required': 'Tên cán bộ là bắt buộc',
        }),
    batDau: Joi.string()
        .pattern(timeRegex)
        .optional()
        .messages({
            'string.pattern.base': 'Thời gian bắt đầu phải có dạng HH:mm (vd: 08:30)',
        }),
    ketThuc: Joi.string()
        .pattern(timeRegex)
        .optional()
        .messages({
            'string.pattern.base': 'Thời gian kết thúc phải có dạng HH:mm (vd: 17:00)',
        }),
    workingPeriods: Joi.array()
        .items(WorkingPeriodSchema)
        .min(1)
        .max(2)
        .optional()
        .messages({
            'array.min': 'Phải có ít nhất một khoảng làm việc',
            'array.max': 'Chỉ hỗ trợ tối đa hai khoảng làm việc trong ngày',
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
}).and('batDau', 'ketThuc').messages({
    'object.and': 'Thời gian bắt đầu và kết thúc phải được truyền cùng nhau',
});
