import Joi from "joi";

export const CreateUyBanRequest = Joi.object({
    tenDonVi: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên ủy ban không được vượt quá 255 ký tự',
            'any.required': 'Tên ủy ban là bắt buộc',
        }),
    diaChi: Joi.string()
        .trim()
        .max(500)
        .required()
        .messages({
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
            'any.required': 'Địa chỉ là bắt buộc',
        }),
    soDienThoai: Joi.string()
        .trim()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Số điện thoại phải từ 10 đến 15 chữ số',
            'any.required': 'Số điện thoại là bắt buộc',
        }),
    email: Joi.string()
        .trim()
        .email()
        .messages({
            'string.email': 'Email không hợp lệ',
        }),
    gioLamViec: Joi.object({
        buoiSang: Joi.object({
            tu: Joi.string()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .required()
                .messages({
                    'string.pattern.base': 'Giờ bắt đầu buổi sáng không hợp lệ (định dạng HH:mm)',
                    'any.required': 'Giờ bắt đầu buổi sáng là bắt buộc',
                }),
            den: Joi.string()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .required()
                .messages({
                    'string.pattern.base': 'Giờ kết thúc buổi sáng không hợp lệ (định dạng HH:mm)',
                    'any.required': 'Giờ kết thúc buổi sáng là bắt buộc',
                }),
        }).required().messages({
            'any.required': 'Thông tin buổi sáng là bắt buộc',
        }),
        buoiChieu: Joi.object({
            tu: Joi.string()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .required()
                .messages({
                    'string.pattern.base': 'Giờ bắt đầu buổi chiều không hợp lệ (định dạng HH:mm)',
                    'any.required': 'Giờ bắt đầu buổi chiều là bắt buộc',
                }),
            den: Joi.string()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .required()
                .messages({
                    'string.pattern.base': 'Giờ kết thúc buổi chiều không hợp lệ (định dạng HH:mm)',
                    'any.required': 'Giờ kết thúc buổi chiều là bắt buộc',
                }),
        }).required().messages({
            'any.required': 'Thông tin buổi chiều là bắt buộc',
        }),
        ghiChu: Joi.string()
            .max(500)
            .optional()
            .messages({
                'string.max': 'Ghi chú không được vượt quá 500 ký tự',
            }),
    }).required().messages({
        'any.required': 'Giờ làm việc là bắt buộc',
    }),
    linkGoogleMap: Joi.string()
        .optional()
        .trim()
});

export const UpdateUyBanRequest = Joi.object({
    tenDonVi: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên ủy ban không được vượt quá 255 ký tự',
            'any.required': 'Tên ủy ban là bắt buộc',
        }),
    diaChi: Joi.string()
        .trim()
        .max(500)
        .required()
        .messages({
            'string.max': 'Địa chỉ không được vượt quá 500 ký tự',
            'any.required': 'Địa chỉ là bắt buộc',
        }),
    soDienThoai: Joi.string()
        .trim()
        .pattern(/^[0-9]{10,15}$/)
        .required()
        .messages({
            'string.pattern.base': 'Số điện thoại phải từ 10 đến 15 chữ số',
            'any.required': 'Số điện thoại là bắt buộc',
        }),
    email: Joi.string()
        .trim()
        .email()
        .messages({
            'string.email': 'Email không hợp lệ',
        }),
    gioLamViec: Joi.object({
        buoiSang: Joi.object({
            tu: Joi.string()
                .trim()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .required()
                .messages({
                    'string.pattern.base': 'Giờ bắt đầu buổi sáng không hợp lệ (định dạng HH:mm)',
                    'any.required': 'Giờ bắt đầu buổi sáng là bắt buộc',
                }),
            den: Joi.string()
                .trim()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .required()
                .messages({
                    'string.pattern.base': 'Giờ kết thúc buổi sáng không hợp lệ (định dạng HH:mm)',
                    'any.required': 'Giờ kết thúc buổi sáng là bắt buộc',
                }),
        }).required().messages({
            'any.required': 'Thông tin buổi sáng là bắt buộc',
        }),
        buoiChieu: Joi.object({
            tu: Joi.string()
                .trim()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .required()
                .messages({
                    'string.pattern.base': 'Giờ bắt đầu buổi chiều không hợp lệ (định dạng HH:mm)',
                    'any.required': 'Giờ bắt đầu buổi chiều là bắt buộc',
                }),
            den: Joi.string()
                .trim()
                .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
                .required()
                .messages({
                    'string.pattern.base': 'Giờ kết thúc buổi chiều không hợp lệ (định dạng HH:mm)',
                    'any.required': 'Giờ kết thúc buổi chiều là bắt buộc',
                }),
        }).required().messages({
            'any.required': 'Thông tin buổi chiều là bắt buộc',
        }),
        ghiChu: Joi.string()
            .trim()
            .max(500)
            .optional()
            .messages({
                'string.max': 'Ghi chú không được vượt quá 500 ký tự',
            }),
    }).required().messages({
        'any.required': 'Giờ làm việc là bắt buộc',
    }),
    linkGoogleMap: Joi.string()
        .trim()
        .optional()
});