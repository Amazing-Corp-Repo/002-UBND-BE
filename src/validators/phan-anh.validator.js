import Joi from "joi";
import PHAN_ANH_MUC_DO from "../constants/phan-anh-muc-do.constant.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";

const vietnamesePhoneRegex = /^(03|05|07|08|09)\d{8}$/;
const complaintCodeRegex = /^[A-Z0-9]{8}$/;
const COMPLAINT_TITLE_MAX_LENGTH = 200;
const COMPLAINT_DESCRIPTION_MAX_LENGTH = 2000;
const COMPLAINT_REPORTER_NAME_MAX_LENGTH = 150;
const COMPLAINT_NEIGHBORHOOD_MAX_LENGTH = 100;
const COMPLAINT_LOCATION_DESCRIPTION_MAX_LENGTH = 500;
const sortFields = [
  "thoi_gian_tao",
  "ma_phan_anh",
  "tieu_de",
  "muc_do",
  "trang_thai",
];

const videoIdsSchema = Joi.array()
  .items(Joi.string().trim().min(1).max(255))
  .max(5)
  .unique()
  .single()
  .optional()
  .messages({
    "array.base": "Danh sách video không hợp lệ",
    "array.max": "Chỉ được đính kèm tối đa 5 video",
    "array.unique": "Danh sách video không được chứa ID trùng nhau",
  });

const citizenIdSchema = Joi.string()
  .trim()
  .pattern(/^\d{12}$/)
  .optional()
  .allow(null, "")
  .messages({
    "string.pattern.base": "CCCD phải gồm đúng 12 chữ số",
  });

const phoneSchema = Joi.string()
  .trim()
  .pattern(vietnamesePhoneRegex)
  .optional()
  .allow(null, "")
  .messages({
    "string.pattern.base": "Số điện thoại Việt Nam không hợp lệ",
  });

const requiredPhoneSchema = Joi.string()
  .trim()
  .pattern(vietnamesePhoneRegex)
  .required()
  .messages({
    "string.pattern.base": "Số điện thoại Việt Nam không hợp lệ",
    "string.empty": "Số điện thoại người phản ánh là bắt buộc",
    "any.required": "Số điện thoại người phản ánh là bắt buộc",
  });

const mucDoSchema = Joi.string()
  .trim()
  .valid(...Object.values(PHAN_ANH_MUC_DO))
  .required()
  .messages({
    "any.only": "Mức độ phải là Thông thường hoặc Khẩn cấp",
    "any.required": "Mức độ là bắt buộc",
  });

export const CreatePhanAnhRequest = Joi.object({
  idLinhVucPhanAnh: Joi.string().trim().uuid().required().messages({
    "string.uuid": "idLinhVucPhanAnh must be a valid UUID",
    "any.required": "Lĩnh vực phản ánh là bắt buộc",
  }),
  tieuDe: Joi.string().trim().min(10).max(COMPLAINT_TITLE_MAX_LENGTH).required().messages({
    "string.min": "Tiêu đề phải có ít nhất 10 ký tự",
    "string.max": `Tiêu đề không được vượt quá ${COMPLAINT_TITLE_MAX_LENGTH} ký tự`,
    "any.required": "Tiêu đề là bắt buộc",
  }),
  moTa: Joi.string().min(20).max(COMPLAINT_DESCRIPTION_MAX_LENGTH).trim().required().messages({
    "string.min": "Mô tả phải có ít nhất 20 ký tự",
    "string.max": `Mô tả không được vượt quá ${COMPLAINT_DESCRIPTION_MAX_LENGTH} ký tự`,
    "any.required": "Mô tả là bắt buộc",
  }),
  viTri: Joi.string().trim().max(500).required().messages({
    "string.max": "Vị trí không được vượt quá 500 ký tự",
    "any.required": "Vị trí là bắt buộc",
  }),
  mucDo: mucDoSchema,
  tenNguoiPhanAnh: Joi.string().trim().max(COMPLAINT_REPORTER_NAME_MAX_LENGTH).optional().allow(null, "").messages({
    "string.base": "Tên người phản ánh phải là chuỗi ký tự",
    "string.max": `Tên người phản ánh không được vượt quá ${COMPLAINT_REPORTER_NAME_MAX_LENGTH} ký tự`,
  }),
  soDienThoaiNguoiPhanAnh: phoneSchema,
  cccd: citizenIdSchema,
  khuPho: Joi.string().trim().max(COMPLAINT_NEIGHBORHOOD_MAX_LENGTH).required().messages({
    "string.base": "Khu phố phải là chuỗi ký tự",
    "string.empty": "Khu phố là bắt buộc",
    "any.required": "Khu phố là bắt buộc",
    "string.max": `Khu phố không được vượt quá ${COMPLAINT_NEIGHBORHOOD_MAX_LENGTH} ký tự`,
  }),
  moTaViTri: Joi.string().trim().max(COMPLAINT_LOCATION_DESCRIPTION_MAX_LENGTH).optional().allow(null, "").messages({
    "string.max": `Mô tả vị trí không được vượt quá ${COMPLAINT_LOCATION_DESCRIPTION_MAX_LENGTH} ký tự`,
  }),
  userId: Joi.string().trim().uuid().optional().allow(null, "").messages({
    "string.uuid": "userId must be a valid UUID",
  }),
  idVideo: videoIdsSchema,
});

export const UpdatePhanAnhStatusRequest = Joi.object({
  trangThai: Joi.string().trim().valid(...Object.values(PHAN_ANH_STATUS)).required().messages({
    "any.only": "Trạng thái phản ánh không hợp lệ",
    "any.required": "Trạng thái là bắt buộc",
  }),
  ghiChu: Joi.string().trim().max(2000).optional().allow(null, "").messages({
    "string.base": "Ghi chú phải là chuỗi ký tự",
    "string.max": "Ghi chú không được vượt quá 2000 ký tự",
  }),
  // Video hiện trường đã xử lý (mảng id của video_uploads đã upload HLS).
  // .single() để nhận cả khi multipart gửi 1 giá trị đơn.
  idVideoGiaiQuyet: videoIdsSchema,
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
  tieuDe: Joi.string().trim().min(10).max(COMPLAINT_TITLE_MAX_LENGTH).required().messages({
    "string.min": "Tiêu đề phải có ít nhất 10 ký tự",
    "string.max": `Tiêu đề không được vượt quá ${COMPLAINT_TITLE_MAX_LENGTH} ký tự`,
    "any.required": "Tiêu đề là bắt buộc",
  }),
  moTa: Joi.string().min(20).max(COMPLAINT_DESCRIPTION_MAX_LENGTH).trim().required().messages({
    "string.min": "Mô tả phải có ít nhất 20 ký tự",
    "string.max": `Mô tả không được vượt quá ${COMPLAINT_DESCRIPTION_MAX_LENGTH} ký tự`,
    "any.required": "Mô tả là bắt buộc",
  }),
  viTri: Joi.string().trim().max(500).required().messages({
    "string.max": "Vị trí không được vượt quá 500 ký tự",
    "any.required": "Vị trí là bắt buộc",
  }),
  mucDo: mucDoSchema,
  tenNguoiPhanAnh: Joi.string().trim().max(COMPLAINT_REPORTER_NAME_MAX_LENGTH).required().messages({
    "string.max": `Tên người phản ánh không được vượt quá ${COMPLAINT_REPORTER_NAME_MAX_LENGTH} ký tự`,
    "any.required": "Tên người phản ánh là bắt buộc",
  }),
  soDienThoaiNguoiPhanAnh: requiredPhoneSchema,
  cccd: citizenIdSchema,
  khuPho: Joi.string().trim().max(COMPLAINT_NEIGHBORHOOD_MAX_LENGTH).required().messages({
    "string.base": "Khu phố phải là chuỗi ký tự",
    "string.empty": "Khu phố là bắt buộc",
    "any.required": "Khu phố là bắt buộc",
    "string.max": `Khu phố không được vượt quá ${COMPLAINT_NEIGHBORHOOD_MAX_LENGTH} ký tự`,
  }),
  moTaViTri: Joi.string().trim().max(COMPLAINT_LOCATION_DESCRIPTION_MAX_LENGTH).optional().allow(null, "").messages({
    "string.max": `Mô tả vị trí không được vượt quá ${COMPLAINT_LOCATION_DESCRIPTION_MAX_LENGTH} ký tự`,
  }),
  idVideo: videoIdsSchema,
});

export const PhanAnhIdParams = Joi.object({
  idPhanAnh: Joi.string().uuid().required().messages({
    "string.guid": "ID phản ánh không hợp lệ",
    "any.required": "ID phản ánh là bắt buộc",
  }),
});

export const PhanAnhCodeParams = Joi.object({
  maPhanAnh: Joi.string().trim().uppercase().pattern(complaintCodeRegex).required().messages({
    "string.pattern.base": "Mã phản ánh không hợp lệ",
    "any.required": "Mã phản ánh là bắt buộc",
  }),
});

export const GetAllPhanAnhQuery = Joi.object({
  idLinhVucPhanAnh: Joi.string().uuid().optional(),
  trangThai: Joi.string().valid(...Object.values(PHAN_ANH_STATUS)).optional(),
  mucDo: Joi.string().valid(...Object.values(PHAN_ANH_MUC_DO)).optional(),
  maPhanAnh: Joi.string().trim().uppercase().max(255).optional().allow(""),
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().min(1).max(100).default(10),
  sortTime: Joi.string().valid("asc", "desc").optional(),
  sortBy: Joi.string().valid(...sortFields).optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
});

export const GetMyPhanAnhQuery = Joi.object({
  sortTime: Joi.string().valid("asc", "desc").default("desc"),
});

export const SearchPhanAnhQuery = Joi.object({
  search: Joi.string().trim().min(3).max(255).required().messages({
    "string.min": "Từ khóa tìm kiếm phải có ít nhất 3 ký tự",
    "string.max": "Từ khóa tìm kiếm không được vượt quá 255 ký tự",
    "any.required": "Từ khóa tìm kiếm là bắt buộc",
  }),
});
