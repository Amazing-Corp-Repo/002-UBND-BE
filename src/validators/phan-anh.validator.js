import Joi from "joi";
import PHAN_ANH_MUC_DO from "../constants/phan-anh-muc-do.constant.js";

const mucDoSchema = Joi.string()
  .trim()
  .valid(...Object.values(PHAN_ANH_MUC_DO))
  .required()
  .messages({
    "any.only": "Mức độ phải là Thấp, Trung bình, Cao hoặc Khẩn cấp",
    "any.required": "Mức độ là bắt buộc",
  });

export const CreatePhanAnhRequest = Joi.object({
  idLinhVucPhanAnh: Joi.string().trim().uuid().required().messages({
    "string.uuid": "idLinhVucPhanAnh must be a valid UUID",
    "any.required": "Lĩnh vực phản ánh là bắt buộc",
  }),
  tieuDe: Joi.string().trim().min(10).required().messages({
    "string.min": "Tiêu đề phải có ít nhất 10 ký tự",
    "any.required": "Tiêu đề là bắt buộc",
  }),
  moTa: Joi.string().min(20).trim().required().messages({
    "string.min": "Mô tả phải có ít nhất 20 ký tự",
    "any.required": "Mô tả là bắt buộc",
  }),
  viTri: Joi.string().required().trim().messages({
    "any.required": "Vị trí là bắt buộc",
  }),
  mucDo: mucDoSchema,
  tenNguoiPhanAnh: Joi.string().trim().optional().allow(null, "").messages({
    "string.base": "Tên người phản ánh phải là chuỗi ký tự",
  }),
  soDienThoaiNguoiPhanAnh: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ",
    }),
  khuPho: Joi.string().trim().max(255).required().messages({
    "string.empty": "Khu phố là bắt buộc",
    "any.required": "Khu phố là bắt buộc",
    "string.max": "Khu phố không được vượt quá 255 ký tự",
  }),
  moTaViTri: Joi.string().trim().max(2000).optional().allow(null, "").messages({
    "string.max": "Mô tả vị trí không được vượt quá 2000 ký tự",
  }),
  userId: Joi.string().trim().uuid().optional().allow(null, "").messages({
    "string.uuid": "userId must be a valid UUID",
  }),
  idVideo: Joi.array().items(Joi.string().trim()).single().optional().messages({
    "array.base": "idVideo phải là một mảng",
  }),
});

export const UpdatePhanAnhStatusRequest = Joi.object({
  trangThai: Joi.string().trim().max(50).required().messages({
    "string.max": "Trạng thái không được vượt quá 50 ký tự",
    "any.required": "Trạng thái là bắt buộc",
  }),
  ghiChu: Joi.string().trim().optional().allow(null, "").messages({
    "string.base": "Ghi chú phải là chuỗi ký tự",
  }),
  // Video hiện trường đã xử lý (mảng id của video_uploads đã upload HLS).
  // .single() để nhận cả khi multipart gửi 1 giá trị đơn.
  idVideoGiaiQuyet: Joi.array()
    .items(Joi.string().trim())
    .single()
    .optional()
    .messages({
      "array.base": "idVideoGiaiQuyet phải là một mảng",
    }),
});

export const UpdatePhanAnhLinhVucRequest = Joi.object({
  idLinhVucPhanAnh: Joi.string().trim().uuid().required().messages({
    "string.uuid": "idLinhVucPhanAnh must be a valid UUID",
    "any.required": "Lĩnh vực phản ánh là bắt buộc",
  }),
  lyDo: Joi.string().trim().max(1000).required().messages({
    "string.empty": "Lý do chuyển lĩnh vực không được để trống",
    "string.max": "Lý do chuyển lĩnh vực không được vượt quá 1000 ký tự",
    "any.required": "Lý do chuyển lĩnh vực là bắt buộc",
  }),
});

export const AssignPhanAnhRequest = Joi.object({
  idNguoiXuLy: Joi.string().trim().uuid().required().messages({
    "string.uuid": "idNguoiXuLy must be a valid UUID",
    "any.required": "Chuyên viên xử lý là bắt buộc",
  }),
  lyDo: Joi.string().trim().max(1000).required().messages({
    "string.empty": "Lý do chuyển xử lý không được để trống",
    "string.max": "Lý do chuyển xử lý không được vượt quá 1000 ký tự",
    "any.required": "Lý do chuyển xử lý là bắt buộc",
  }),
});

export const CreatePhanAnhPublicRequest = Joi.object({
  idLinhVucPhanAnh: Joi.string().trim().uuid().required().messages({
    "string.uuid": "idLinhVucPhanAnh must be a valid UUID",
    "any.required": "Lĩnh vực phản ánh là bắt buộc",
  }),
  tieuDe: Joi.string().trim().min(10).required().messages({
    "string.min": "Tiêu đề phải có ít nhất 10 ký tự",
    "any.required": "Tiêu đề là bắt buộc",
  }),
  moTa: Joi.string().min(20).trim().required().messages({
    "string.min": "Mô tả phải có ít nhất 20 ký tự",
    "any.required": "Mô tả là bắt buộc",
  }),
  viTri: Joi.string().required().trim().messages({
    "any.required": "Vị trí là bắt buộc",
  }),
  mucDo: mucDoSchema,
  tenNguoiPhanAnh: Joi.string().trim().required().messages({
    "any.required": "Tên người phản ánh là bắt buộc",
  }),
  soDienThoaiNguoiPhanAnh: Joi.string()
    .trim()
    .pattern(/^[0-9]{10,15}$/)
    .optional()
    .allow(null, "")
    .messages({
      "string.pattern.base": "Số điện thoại không hợp lệ",
    }),
  khuPho: Joi.string().trim().max(255).required().messages({
    "string.empty": "Khu phố là bắt buộc",
    "any.required": "Khu phố là bắt buộc",
    "string.max": "Khu phố không được vượt quá 255 ký tự",
  }),
  moTaViTri: Joi.string().trim().max(2000).optional().allow(null, "").messages({
    "string.max": "Mô tả vị trí không được vượt quá 2000 ký tự",
  }),
  idVideo: Joi.array().items(Joi.string().trim()).single().optional().messages({
    "array.base": "idVideo phải là một mảng",
  }),
});
