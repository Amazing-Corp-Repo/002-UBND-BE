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
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Mã loại thủ tục không được vượt quá 50 ký tự',
        }),
    doiTuongThucHien: Joi.string()
        .trim()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Đối tượng thực hiện không được vượt quá 255 ký tự',
        }),
    yeuCauDieuKienChung: Joi.string()
        .trim()
        .allow(null, '')
        .optional(),
    soQuyetDinh: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .max(255)
        .messages({
            'string.max': 'Số quyết định không được vượt quá 255 ký tự',
        }),
    danhSachLinhVucIds: Joi.array()
        .required()
        .items(Joi.string().trim().uuid().messages({
            'string.uuid': 'ID lĩnh vực không hợp lệ',
            'any.required': 'Danh sách lĩnh vực là bắt buộc',
        })),
    danhSachMauDon: Joi.array()
        .optional()
        .allow(null)
        .items(
            Joi.object({
                id: Joi.string()
                    .uuid()
                    .required()
                    .messages({
                        'string.uuid': 'ID mẫu đơn không hợp lệ',
                        'any.required': 'ID mẫu đơn là bắt buộc',
                    }),
                soLuongBanChinh: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .messages({
                        'number.base': 'Số lượng bản chính phải là một số',
                        'number.min': 'Số lượng bản chính không được âm',
                        'any.required': 'Số lượng bản chính là bắt buộc',
                    }),
                soLuongBanSao: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .messages({
                        'number.base': 'Số lượng bản sao phải là một số',
                        'number.min': 'Số lượng bản sao không được âm',
                        'any.required': 'Số lượng bản sao là bắt buộc',
                    }),
                ghiChu: Joi.string()
                    .trim()
                    .optional()
                    .allow(null, '')
            })
        ),
    cachThuThucHien: Joi.array()
        .optional()
        .allow(null)
        .items(
            Joi.object({
                hinhThucApDung: Joi.string()
                    .trim()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Hình thức áp dụng không được vượt quá 255 ký tự',
                        'any.required': 'Hình thức áp dụng là bắt buộc',
                    }),
                moTaChiTiet: Joi.string()
                    .trim()
                    .optional()
                    .allow(null, '')
                    .messages({
                        'string.max': 'Mô tả chi tiết không được vượt quá 1000 ký tự',
                    }),
                thoiGianGiaiQuyet: Joi.string()
                    .trim()
                    .max(255)
                    .optional()
                    .allow(null, '')
                    .messages({
                        'string.max': 'Thời gian giải quyết không được vượt quá 255 ký tự',
                    }),
                lePhi: Joi.string()
                    .optional()
                    .allow(null, ''),
                ghiChuLePhi: Joi.string()
                    .trim()
                    .optional()
                    .allow(null, '')
                    .messages({
                        'string.max': 'Ghi chú lệ phí không được vượt quá 500 ký tự',
                    }),
            })
        ),
    trinhTuThucHien: Joi.array()
        .optional()
        .allow(null)
        .items(
            Joi.object({
                tenBuoc: Joi.string()
                    .trim()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Tên bước không được vượt quá 255 ký tự',
                        'any.required': 'Tên bước là bắt buộc',
                    }),
                moTaBuoc: Joi.string()
                    .trim()
                    .optional()
                    .allow(null, '')
                    .messages({
                        'string.max': 'Mô tả bước không được vượt quá 1000 ký tự',
                    }),
                thuTuBuoc: Joi.number()
                    .integer()
                    .min(1)
                    .required()
                    .messages({
                        'number.base': 'Thứ tự bước phải là một số',
                        'number.min': 'Thứ tự bước phải lớn hơn hoặc bằng 1',
                        'any.required': 'Thứ tự bước là bắt buộc',
                    }),
            })
        ),
    truongHopThuTuc: Joi.array()
        .optional()
        .allow(null)
        .items(
            Joi.object({
                tenTruongHop: Joi.string()
                    .trim()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Tên trường hợp không được vượt quá 255 ký tự',
                        'any.required': 'Tên trường hợp là bắt buộc',
                    }),
                moTa: Joi.string()
                    .trim()
                    .optional()
                    .allow(null, '')
                    .messages({
                        'string.max': 'Mô tả không được vượt quá 1000 ký tự',
                    }),
                thuTu: Joi.number()
                    .integer()
                    .min(1)
                    .optional()
                    .messages({
                        'number.base': 'Thứ tự phải là một số',
                        'number.min': 'Thứ tự phải lớn hơn hoặc bằng 1',
                    }),
                thanhPhanHoSo: Joi.array()
                    .optional()
                    .allow(null)
                    .items(
                        Joi.object({
                            tenThanhPhan: Joi.string()
                                .trim()
                                .max(255)
                                .required()
                                .messages({
                                    'string.max': 'Tên thành phần không được vượt quá 255 ký tự',
                                    'any.required': 'Tên thành phần là bắt buộc',
                                }),
                            moTaChiTiet: Joi.string()
                                .trim()
                                .optional()
                                .allow(null, '')
                                .messages({
                                    'string.max': 'Mô tả chi tiết không được vượt quá 1000 ký tự',
                                }),
                            soLuongBanChinh: Joi.number()
                                .integer()
                                .min(0)
                                .optional()
                                .messages({
                                    'number.base': 'Số lượng bản chính phải là một số',
                                    'number.min': 'Số lượng bản chính không được âm',
                                }),
                            soLuongBanSao: Joi.number()
                                .integer()
                                .min(0)
                                .optional()
                                .messages({
                                    'number.base': 'Số lượng bản sao phải là một số',
                                    'number.min': 'Số lượng bản sao không được âm',
                                }),
                            ghiChu: Joi.string()
                                .trim()
                                .optional()
                                .allow(null, ''),
                        })
                    ),
            })
        ),
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
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Mã loại thủ tục không được vượt quá 50 ký tự',
        }),
    doiTuongThucHien: Joi.string()
        .trim()
        .max(255)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'Đối tượng thực hiện không được vượt quá 255 ký tự',
        }),
    yeuCauDieuKienChung: Joi.string()
        .trim()
        .allow(null, '')
        .optional(),
    soQuyetDinh: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .max(255)
        .messages({
            'string.max': 'Số quyết định không được vượt quá 255 ký tự',
        }),
    danhSachLinhVucIds: Joi.array()
        .required()
        .items(Joi.string().trim().uuid().messages({
            'string.uuid': 'ID lĩnh vực không hợp lệ',
            'any.required': 'Danh sách lĩnh vực là bắt buộc',
        })),
    danhSachMauDon: Joi.array()
        .optional()
        .allow(null)
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
                soLuongBanChinh: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .messages({
                        'number.base': 'Số lượng bản chính phải là một số',
                        'number.min': 'Số lượng bản chính không được âm',
                        'any.required': 'Số lượng bản chính là bắt buộc',
                    }),
                soLuongBanSao: Joi.number()
                    .integer()
                    .min(0)
                    .required()
                    .messages({
                        'number.base': 'Số lượng bản sao phải là một số',
                        'number.min': 'Số lượng bản sao không được âm',
                        'any.required': 'Số lượng bản sao là bắt buộc',
                    }),
                ghiChu: Joi.string()
                    .trim()
                    .optional()
                    .allow(null, '')
            })
        ),
    cachThuThucHien: Joi.array()
        .optional()
        .allow(null)
        .items(
            Joi.object({
                id: Joi.string()
                    .trim()
                    .uuid()
                    .optional()
                    .messages({
                        'string.uuid': 'ID cách thức thực hiện không hợp lệ',
                    }),
                hinhThucApDung: Joi.string()
                    .trim()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Hình thức áp dụng không được vượt quá 255 ký tự',
                        'any.required': 'Hình thức áp dụng là bắt buộc',
                    }),
                moTaChiTiet: Joi.string()
                    .trim()
                    .optional()
                    .allow(null, '')
                    .messages({
                        'string.max': 'Mô tả chi tiết không được vượt quá 1000 ký tự',
                    }),
                thoiGianGiaiQuyet: Joi.string()
                    .trim()
                    .max(255)
                    .optional()
                    .allow(null, '')
                    .messages({
                        'string.max': 'Thời gian giải quyết không được vượt quá 255 ký tự',
                    }),
                lePhi: Joi.string()
                    .optional()
                    .allow(null, ''),
                ghiChuLePhi: Joi.string()
                    .trim()
                    .optional()
                    .allow(null, '')
                    .messages({
                        'string.max': 'Ghi chú lệ phí không được vượt quá 500 ký tự',
                    }),
            })
        ),
    trinhTuThucHien: Joi.array()
        .optional()
        .allow(null)
        .items(
            Joi.object({
                id: Joi.string()
                    .trim()
                    .uuid()
                    .optional()
                    .messages({
                        'string.uuid': 'ID trình tự thực hiện không hợp lệ',
                    }),
                tenBuoc: Joi.string()
                    .trim()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Tên bước không được vượt quá 255 ký tự',
                        'any.required': 'Tên bước là bắt buộc',
                    }),
                moTaBuoc: Joi.string()
                    .trim()
                    .optional()
                    .allow(null, '')
                    .messages({
                        'string.max': 'Mô tả bước không được vượt quá 1000 ký tự',
                    }),
                thuTuBuoc: Joi.number()
                    .integer()
                    .min(1)
                    .required()
                    .messages({
                        'number.base': 'Thứ tự bước phải là một số',
                        'number.min': 'Thứ tự bước phải lớn hơn hoặc bằng 1',
                        'any.required': 'Thứ tự bước là bắt buộc',
                    }),
            })
        ),
    truongHopThuTuc: Joi.array()
        .optional()
        .allow(null)
        .items(
            Joi.object({
                id: Joi.string()
                    .trim()
                    .uuid()
                    .optional()
                    .messages({
                        'string.uuid': 'ID trường hợp không hợp lệ',
                    }),
                tenTruongHop: Joi.string()
                    .trim()
                    .max(255)
                    .required()
                    .messages({
                        'string.max': 'Tên trường hợp không được vượt quá 255 ký tự',
                        'any.required': 'Tên trường hợp là bắt buộc',
                    }),
                moTa: Joi.string()
                    .trim()
                    .optional()
                    .allow(null, '')
                    .messages({
                        'string.max': 'Mô tả không được vượt quá 1000 ký tự',
                    }),
                thuTu: Joi.number()
                    .integer()
                    .min(1)
                    .optional()
                    .messages({
                        'number.base': 'Thứ tự phải là một số',
                        'number.min': 'Thứ tự phải lớn hơn hoặc bằng 1',
                    }),
                thanhPhanHoSo: Joi.array()
                    .optional()
                    .allow(null)
                    .items(
                        Joi.object({
                            id: Joi.string()
                                .trim()
                                .uuid()
                                .optional()
                                .messages({
                                    'string.uuid': 'ID thành phần hồ sơ không hợp lệ',
                                }),
                            tenThanhPhan: Joi.string()
                                .trim()
                                .max(255)
                                .required()
                                .messages({
                                    'string.max': 'Tên thành phần không được vượt quá 255 ký tự',
                                    'any.required': 'Tên thành phần là bắt buộc',
                                }),
                            moTaChiTiet: Joi.string()
                                .trim()
                                .optional()
                                .allow(null, '')
                                .messages({
                                    'string.max': 'Mô tả chi tiết không được vượt quá 1000 ký tự',
                                }),
                            soLuongBanChinh: Joi.number()
                                .integer()
                                .min(0)
                                .optional()
                                .messages({
                                    'number.base': 'Số lượng bản chính phải là một số',
                                    'number.min': 'Số lượng bản chính không được âm',
                                }),
                            soLuongBanSao: Joi.number()
                                .integer()
                                .min(0)
                                .optional()
                                .messages({
                                    'number.base': 'Số lượng bản sao phải là một số',
                                    'number.min': 'Số lượng bản sao không được âm',
                                }),
                            ghiChu: Joi.string()
                                .trim()
                                .optional()
                                .allow(null, ''),
                        })
                    ),
            })
        ),
});

export const UpdateThucTucStatusRequest = Joi.object({
    isActive: Joi.boolean()
        .required()
        .messages({
            'any.required': 'Trạng thái hoạt động là bắt buộc',
        }),
});
