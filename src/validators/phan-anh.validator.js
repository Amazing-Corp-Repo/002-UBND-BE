import Joi from "joi";

export const CreatePhanAnhRequest = Joi.object({
    idLinhVucPhanAnh: Joi.string()
        .trim()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'idLinhVucPhanAnh must be a valid UUID',
            'any.required': 'Lĩnh vực phản ánh là bắt buộc',
        }),
    tieuDe: Joi.string()
        .trim()
        .min(10)
        .required()
        .messages({
            'string.min': 'Tiêu đề phải có ít nhất 10 ký tự',
            'any.required': 'Tiêu đề là bắt buộc',
        }),
    moTa: Joi.string()
        .min(20)
        .trim()
        .required()
        .messages({
            'string.min': 'Mô tả phải có ít nhất 20 ký tự',
            'any.required': 'Mô tả là bắt buộc',
        }),
    viTri: Joi.string()
        .required()
        .trim()
        .messages({
            'any.required': 'Vị trí là bắt buộc',
        }),
    mucDo: Joi.string()
        .trim()
        .required(),
    tenNguoiPhanAnh: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Tên người phản ánh phải là chuỗi ký tự',
        }),
    soDienThoaiNguoiPhanAnh: Joi.string()
        .trim()
        .pattern(/^[0-9]{10,15}$/)
        .optional()
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Số điện thoại không hợp lệ',
        }),
    userId: Joi.string()
        .trim()
        .uuid()
        .optional()
        .allow(null, '')
        .messages({
            'string.uuid': 'userId must be a valid UUID',
        }),
    idVideo: Joi.array()
        .items(Joi.string().trim())
        .optional()
        .messages({
            'array.base': 'idVideo phải là một mảng',
        }),
});

export const UpdatePhanAnhStatusRequest = Joi.object({
    // thoiGianPhanHoiDuKien: Joi.date()
    //     .required()
    //     .messages({
    //         'date.base': 'Thời gian phản hồi dự kiến phải là định dạng ngày tháng hợp lệ',
    //         'any.required': 'Thời gian phản hồi dự kiến là bắt buộc',
    //     }),
    // ngayDuKienHoanThanh: Joi.date()
    //     .required()
    //     .messages({
    //         'date.base': 'Ngày dự kiến hoàn thành phải là định dạng ngày tháng hợp lệ',
    //         'any.required': 'Ngày dự kiến hoàn thành là bắt buộc',
    //     }),
    trangThai: Joi.string()
        .trim()
        .max(50)
        .required()
        .messages({
            'string.max': 'Trạng thái không được vượt quá 50 ký tự',
            'any.required': 'Trạng thái là bắt buộc',
        }),
    ghiChu: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Ghi chú phải là chuỗi ký tự',
        }),
});