import Joi from 'joi';

export const CreateThuTucRequest = Joi.object({
    idCoSoDichVuCong: Joi.string()
        .trim()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'ID cơ sở dịch vụ công không hợp lệ',
            'any.required': 'ID cơ sở dịch vụ công là bắt buộc',
        }),
    tenThuTuc: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên thủ tục không được vượt quá 255 ký tự',
            'any.required': 'Tên thủ tục là bắt buộc',
        }),
    maThuTuc: Joi.string()
        .trim()
        .max(50)
        .required()
        .messages({
            'string.max': 'Mã loại thủ tục không được vượt quá 50 ký tự',
            'any.required': 'Mã loại thủ tục là bắt buộc',
        }),
    doiTuongThucHien: Joi.string()
        .trim()
        .max(255)
        .optional()
        .messages({
            'string.max': 'Đối tượng thực hiện không được vượt quá 255 ký tự',
        }),
    yeuCauDieuKienChung: Joi.string()
        .trim()
        .optional(),
    soQuyetDinh: Joi.string()
        .trim()
        .required()
        .max(255)
        .messages({
            'any.required': 'Số quyết định là bắt buộc',
        }),
    danhSachLinhVucIds: Joi.array()
        .required()
        .items(Joi.string().trim().uuid().messages({
            'string.uuid': 'ID lĩnh vực không hợp lệ',
            'any.required': 'Danh sách lĩnh vực là bắt buộc',
        })),
    danhSachMauDon: Joi.array()
        .required()
        .items(
            Joi.object({
                id: Joi.string()
                    .uuid()
                    .required()
                    .messages({
                        'string.uuid': 'ID mẫu đơn không hợp lệ',
                        'any.required': 'ID mẫu đơn là bắt buộc',
                    }),
                so_luong_ban_chinh: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .messages({
                        'number.base': 'Số lượng bản chính phải là một số',
                        'number.min': 'Số lượng bản chính không được âm',
                        'any.required': 'Số lượng bản chính là bắt buộc',
                    }),
                so_luong_ban_sao: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .messages({
                        'number.base': 'Số lượng bản sao phải là một số',
                        'number.min': 'Số lượng bản sao không được âm',
                        'any.required': 'Số lượng bản sao là bắt buộc',
                    }),
                ghi_chu: Joi.string()
                    .optional()
            })
        ),
    cachThuThucHien: Joi.array()
        .required()
        .items(
            Joi.object({
                hinh_thuc_ap_dung: Joi.string()
                    .trim()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Hình thức áp dụng không được vượt quá 255 ký tự',
                        'any.required': 'Hình thức áp dụng là bắt buộc',
                    }),
                mo_ta_chi_tiet: Joi.string()
                    .trim()
                    .optional()
                    .messages({
                        'string.max': 'Mô tả chi tiết không được vượt quá 1000 ký tự',
                    }),
                thoi_gian_giai_quyet: Joi.string()
                    .trim()
                    .max(255)
                    .optional()
                    .messages({
                        'string.max': 'Thời gian giải quyết không được vượt quá 255 ký tự',
                    }),
                le_phi: Joi.number()
                    .min(0)
                    .optional()
                    .messages({
                        'number.base': 'Lệ phí phải là một số',
                        'number.min': 'Lệ phí không được âm',
                    }),
                ghi_chu_le_phi: Joi.string()
                    .trim()
                    .optional()
                    .messages({
                        'string.max': 'Ghi chú lệ phí không được vượt quá 500 ký tự',
                    }),
            })
        ),
    trinhTuThucHien: Joi.array()
        .required()
        .items(
            Joi.object({
                ten_buoc: Joi.string()
                    .trim()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Tên bước không được vượt quá 255 ký tự',
                        'any.required': 'Tên bước là bắt buộc',
                    }),
                mo_ta_buoc: Joi.string()
                    .trim()
                    .optional()
                    .messages({
                        'string.max': 'Mô tả bước không được vượt quá 1000 ký tự',
                    }),
                thu_tu_buoc: Joi.number()
                    .integer()
                    .min(1)
                    .required()
                    .messages({
                        'number.base': 'Thứ tự bước phải là một số',
                        'number.min': 'Thứ tự bước phải lớn hơn hoặc bằng 1',
                        'any.required': 'Thứ tự bước là bắt buộc',
                    }),
            })
        )
});

export const UpdateThuTucRequest = Joi.object({
    idCoSoDichVuCong: Joi.string()
        .trim()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'ID cơ sở dịch vụ công không hợp lệ',
            'any.required': 'ID cơ sở dịch vụ công là bắt buộc',
        }),
    tenThuTuc: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Tên thủ tục không được vượt quá 255 ký tự',
            'any.required': 'Tên thủ tục là bắt buộc',
        }),
    maThuTuc: Joi.string()
        .trim()
        .max(50)
        .required()
        .messages({
            'string.max': 'Mã loại thủ tục không được vượt quá 50 ký tự',
            'any.required': 'Mã loại thủ tục là bắt buộc',
        }),
    doiTuongThucHien: Joi.string()
        .trim()
        .max(255)
        .optional()
        .messages({
            'string.max': 'Đối tượng thực hiện không được vượt quá 255 ký tự',
        }),
    yeuCauDieuKienChung: Joi.string()
        .trim()
        .optional(),
    soQuyetDinh: Joi.string()
        .trim()
        .required()
        .max(255)
        .messages({
            'any.required': 'Số quyết định là bắt buộc',
        }),
    isRemoved: Joi.boolean()
        .required()
        .messages({
            'boolean.base': 'isRemoved phải là kiểu boolean',
        }),
    danhSachLinhVucIds: Joi.array()
        .required()
        .items(Joi.string().trim().uuid().messages({
            'string.uuid': 'ID lĩnh vực không hợp lệ',
            'any.required': 'Danh sách lĩnh vực là bắt buộc',
        })),
    danhSachMauDon: Joi.array()
        .required()
        .items(
            Joi.object({
                id: Joi.string()
                    .trim()
                    .uuid()
                    .required()
                    .messages({
                        'string.uuid': 'ID mẫu đơn không hợp lệ',
                        'any.required': 'ID mẫu đơn là bắt buộc',
                    }),
                so_luong_ban_chinh: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .messages({
                        'number.base': 'Số lượng bản chính phải là một số',
                        'number.min': 'Số lượng bản chính không được âm',
                        'any.required': 'Số lượng bản chính là bắt buộc',
                    }),
                so_luong_ban_sao: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .messages({
                        'number.base': 'Số lượng bản sao phải là một số',
                        'number.min': 'Số lượng bản sao không được âm',
                        'any.required': 'Số lượng bản sao là bắt buộc',
                    }),
                ghi_chu: Joi.string()
                    .trim()
                    .optional()
            })
        ),
    cachThuThucHien: Joi.array()
        .required()
        .items(
            Joi.object({
                id: Joi.string()
                    .trim()
                    .uuid()
                    .optional()
                    .messages({
                        'string.uuid': 'ID cách thức thực hiện không hợp lệ',
                    }),
                hinh_thuc_ap_dung: Joi.string()
                    .trim()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Hình thức áp dụng không được vượt quá 255 ký tự',
                        'any.required': 'Hình thức áp dụng là bắt buộc',
                    }),
                mo_ta_chi_tiet: Joi.string()
                    .trim()
                    .optional()
                    .messages({
                        'string.max': 'Mô tả chi tiết không được vượt quá 1000 ký tự',
                    }),
                thoi_gian_giai_quyet: Joi.string()
                    .trim()
                    .max(255)
                    .optional()
                    .messages({
                        'string.max': 'Thời gian giải quyết không được vượt quá 255 ký tự',
                    }),
                le_phi: Joi.number()
                    .min(0)
                    .optional()
                    .messages({
                        'number.base': 'Lệ phí phải là một số',
                        'number.min': 'Lệ phí không được âm',
                    }),
                ghi_chu_le_phi: Joi.string()
                    .trim()
                    .optional()
                    .messages({
                        'string.max': 'Ghi chú lệ phí không được vượt quá 500 ký tự',
                    }),
            })
        ),
    trinhTuThucHien: Joi.array()
        .required()
        .items(
            Joi.object({
                id: Joi.string()
                    .trim()
                    .uuid()
                    .optional()
                    .messages({
                        'string.uuid': 'ID trình tự thực hiện không hợp lệ',
                    }),
                ten_buoc: Joi.string()
                    .trim()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Tên bước không được vượt quá 255 ký tự',
                        'any.required': 'Tên bước là bắt buộc',
                    }),
                mo_ta_buoc: Joi.string()
                    .trim()
                    .optional()
                    .messages({
                        'string.max': 'Mô tả bước không được vượt quá 1000 ký tự',
                    }),
                thu_tu_buoc: Joi.number()
                    .integer()
                    .min(1)
                    .required()
                    .messages({
                        'number.base': 'Thứ tự bước phải là một số',
                        'number.min': 'Thứ tự bước phải lớn hơn hoặc bằng 1',
                        'any.required': 'Thứ tự bước là bắt buộc',
                    }),
            })
        )
});