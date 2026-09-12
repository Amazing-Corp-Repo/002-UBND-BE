import Joi from "joi";
import PHAN_ANH_MUC_DO from "../constants/phan-anh-muc-do.constant.js";
import PHAN_ANH_STATUS, { PHAN_ANH_LIFECYCLE_STATUS } from "../constants/phan-anh-status.constant.js";
import { normalizeKhuPho } from "../utils/string.util.js";
import { parseDateOnly } from "../utils/dashboard.util.js";

const vietnamesePhoneRegex = /^(03|05|07|08|09)\d{8}$/;
const complaintCodeRegex = /^[A-Z0-9]{8}$/;
const COMPLAINT_TITLE_MAX_LENGTH = 200;
const COMPLAINT_DESCRIPTION_MAX_LENGTH = 2000;
const COMPLAINT_REPORTER_NAME_MAX_LENGTH = 150;
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

const khuPhoSchema = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const normalized = normalizeKhuPho(value);
    return normalized || helpers.error("any.invalid");
  })
  .required()
  .messages({
    "any.invalid": "Khu phố phải từ Khu phố 1 đến Khu phố 45",
    "any.required": "Khu phố là bắt buộc",
    "string.empty": "Khu phố là bắt buộc",
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
  khuPho: khuPhoSchema,
  moTaViTri: Joi.string().trim().max(COMPLAINT_LOCATION_DESCRIPTION_MAX_LENGTH).optional().allow(null, "").messages({
    "string.max": `Mô tả vị trí không được vượt quá ${COMPLAINT_LOCATION_DESCRIPTION_MAX_LENGTH} ký tự`,
  }),
  idVideo: videoIdsSchema,
});

export const UpdatePhanAnhStatusRequest = Joi.object({
  trangThai: Joi.string().trim().valid(...PHAN_ANH_LIFECYCLE_STATUS, "DA_GUI", "DANG_XU_LY", "DA_GIAI_QUYET", "DONG", "TU_CHOI").required().messages({
    "any.only": "Trạng thái phản ánh không hợp lệ",
    "any.required": "Trạng thái là bắt buộc",
  }),
  ghiChu: Joi.string().trim().max(2000).optional().allow(null, "").messages({
    "string.base": "Ghi chú phải là chuỗi ký tự",
    "string.max": "Ghi chú không được vượt quá 2000 ký tự",
  }),
  ngayDuKienHoanThanh: Joi.date().iso().optional().messages({
    "date.base": "Ngày dự kiến hoàn thành không hợp lệ",
    "date.format": "Ngày dự kiến hoàn thành phải có định dạng ISO 8601",
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

export const UpdatePhanAnhMucDoRequest = Joi.object({
  mucDo: Joi.string()
    .trim()
    .valid(...Object.values(PHAN_ANH_MUC_DO), "KHAN_CAP", "BINH_THUONG")
    .required()
    .messages({
      "any.only": "Mức độ phải là Thông thường hoặc Khẩn cấp",
      "any.required": "Mức độ là bắt buộc",
    }),
  lyDo: Joi.string().trim().max(1000).required().messages({
    "string.empty": "Lý do đổi mức độ không được để trống",
    "string.max": "Lý do đổi mức độ không được vượt quá 1000 ký tự",
    "any.required": "Lý do đổi mức độ là bắt buộc",
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
  khuPho: khuPhoSchema,
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
  idLinhVuc: Joi.string().uuid().optional(),
  trangThai: Joi.string().valid(...PHAN_ANH_LIFECYCLE_STATUS, "DA_GUI", "DANG_XU_LY", "DA_GIAI_QUYET", "DONG", "TU_CHOI").optional(),
  mucDo: Joi.string().valid(...Object.values(PHAN_ANH_MUC_DO), "KHAN_CAP", "BINH_THUONG").optional(),
  maPhanAnh: Joi.string().trim().uppercase().max(255).optional().allow(""),
  search: Joi.string().trim().max(255).optional().allow(""),
  khuPho: Joi.string().trim().max(255).optional().allow("", "all"),
  startDate: Joi.string().custom((value, helpers) => {
    if (!parseDateOnly(value)) return helpers.error("date.format");
    return value;
  }).optional(),
  endDate: Joi.string().custom((value, helpers) => {
    if (!parseDateOnly(value)) return helpers.error("date.format");
    return value;
  }).optional(),
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().min(1).max(100).default(10),
  sortTime: Joi.string().valid("asc", "desc").optional(),
  sortBy: Joi.string().valid(...sortFields).optional(),
  sortOrder: Joi.string().valid("asc", "desc").optional(),
}).custom((value, helpers) => {
  if (Boolean(value.startDate) !== Boolean(value.endDate)) {
    return helpers.error("date.pair");
  }
  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    return helpers.error("date.range");
  }
  return value;
}).messages({
  "date.format": "Ngày lọc phải có định dạng YYYY-MM-DD hợp lệ",
  "date.pair": "startDate và endDate phải được gửi cùng nhau",
  "date.range": "startDate không được lớn hơn endDate",
});

export const ExportPhanAnhExcelRequest = Joi.object({
  columns: Joi.array()
    .items(Joi.string().valid(
      "index",
      "ma_phan_anh",
      "tieu_de",
      "khu_pho",
      "linh_vuc_phan_anh",
      "muc_do",
      "lich_su_trang_thai",
      "thoi_gian_tao",
      "han_xu_ly",
      "thong_tin_lien_he",
      "sla_status",
    ))
    .min(1)
    .unique()
    .required()
    .messages({
      "array.base": "Danh sách cột phải là mảng",
      "array.min": "Phải chọn ít nhất một cột để xuất",
      "array.unique": "Danh sách cột không được chứa giá trị trùng lặp",
      "any.only": "Danh sách cột chứa cột không được hỗ trợ",
      "any.required": "Danh sách cột là bắt buộc",
    }),
  search: Joi.string().trim().max(255).optional().allow(""),
  trangThai: Joi.string()
    .valid(...PHAN_ANH_LIFECYCLE_STATUS, "DA_GUI", "DANG_XU_LY", "DA_GIAI_QUYET", "DONG", "TU_CHOI")
    .optional()
    .allow(""),
  idLinhVucPhanAnh: Joi.string().uuid().optional().allow(""),
  khuPho: Joi.string().trim().max(255).optional().allow("", "all"),
  mucDo: Joi.string()
    .valid(...Object.values(PHAN_ANH_MUC_DO), "KHAN_CAP", "BINH_THUONG")
    .optional()
    .allow(""),
  startDate: Joi.string().custom((value, helpers) => {
    if (!parseDateOnly(value)) return helpers.error("date.format");
    return value;
  }).optional().allow(""),
  endDate: Joi.string().custom((value, helpers) => {
    if (!parseDateOnly(value)) return helpers.error("date.format");
    return value;
  }).optional().allow(""),
  sortTime: Joi.string().valid("asc", "desc").default("desc"),
}).custom((value, helpers) => {
  if (Boolean(value.startDate) !== Boolean(value.endDate)) {
    return helpers.error("date.pair");
  }
  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    return helpers.error("date.range");
  }
  return value;
}).messages({
  "date.format": "Ngày lọc phải có định dạng YYYY-MM-DD hợp lệ",
  "date.pair": "startDate và endDate phải được gửi cùng nhau",
  "date.range": "startDate không được lớn hơn endDate",
});

export const GetDashboardQuery = Joi.object({
  preset: Joi.string()
    .valid("today", "yesterday", "7days", "30days", "thisMonth", "thisQuarter", "custom")
    .optional(),
  startDate: Joi.string()
    .custom((value, helpers) => {
      if (!parseDateOnly(value)) return helpers.error("date.format");
      return value;
    })
    .messages({ "date.format": "startDate phải có định dạng YYYY-MM-DD hợp lệ" })
    .optional(),
  endDate: Joi.string()
    .custom((value, helpers) => {
      if (!parseDateOnly(value)) return helpers.error("date.format");
      return value;
    })
    .messages({ "date.format": "endDate phải có định dạng YYYY-MM-DD hợp lệ" })
    .optional(),
  khuPho: Joi.string().trim().optional().default("all"),
  idLinhVuc: Joi.alternatives()
    .try(Joi.string().valid("all"), Joi.string().uuid())
    .optional()
    .default("all"),
}).custom((value, helpers) => {
  const hasStart = Boolean(value.startDate);
  const hasEnd = Boolean(value.endDate);

  if (hasStart !== hasEnd) {
    return helpers.error("date.pair");
  }

  if (value.preset === "custom" && (!hasStart || !hasEnd)) {
    return helpers.error("date.customRequired");
  }

  if (hasStart && hasEnd && value.startDate > value.endDate) {
    return helpers.error("date.range");
  }

  return value;
}).messages({
  "date.pair": "startDate và endDate phải được gửi cùng nhau",
  "date.customRequired": "preset=custom bắt buộc có startDate và endDate",
  "date.range": "startDate không được lớn hơn endDate",
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
