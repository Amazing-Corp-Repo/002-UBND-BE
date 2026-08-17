import Joi from "joi";

const vietnameseNameRegex = /^[\p{L}\s'.-]+$/u;
const vietnamesePhoneRegex = /^(03|05|07|08|09)\d{8}$/;
const timeSlotRegex = /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d$/;

export const CreateDangKyTiepDanRequest = Joi.object({
  idLichTiepDan: Joi.string().uuid().required().messages({
    "string.guid": "ID lịch tiếp dân không hợp lệ",
    "any.required": "ID lịch tiếp dân là bắt buộc",
  }),
  slot: Joi.string().trim().pattern(timeSlotRegex).required().messages({
    "string.pattern.base": "Khung giờ phải có dạng HH:mm - HH:mm",
    "any.required": "Khung giờ là bắt buộc",
  }),
  chuDe: Joi.string().trim().max(255).required().messages({
    "string.max": "Chủ đề không được vượt quá 255 ký tự",
    "any.required": "Chủ đề là bắt buộc",
    "string.empty": "Chủ đề là bắt buộc",
  }),
  lyDo: Joi.string().trim().min(10).max(500).required().messages({
    "string.min": "Nội dung làm việc phải có ít nhất 10 ký tự",
    "string.max": "Nội dung làm việc không được vượt quá 500 ký tự",
    "any.required": "Nội dung làm việc là bắt buộc",
    "string.empty": "Nội dung làm việc là bắt buộc",
  }),
  hoTen: Joi.string().trim().max(150).pattern(vietnameseNameRegex).required().messages({
    "string.pattern.base": "Họ tên chỉ được chứa chữ cái và khoảng trắng",
    "string.max": "Họ tên không được vượt quá 150 ký tự",
    "any.required": "Họ tên là bắt buộc",
    "string.empty": "Họ tên là bắt buộc",
  }),
  sdt: Joi.string().trim().pattern(vietnamesePhoneRegex).required().messages({
    "string.pattern.base": "Số điện thoại Việt Nam không hợp lệ",
    "any.required": "Số điện thoại là bắt buộc",
  }),
  cccd: Joi.string().trim().pattern(/^\d{12}$/).required().messages({
    "string.pattern.base": "CCCD phải gồm đúng 12 chữ số",
    "any.required": "CCCD là bắt buộc",
  }),
  diaChi: Joi.string().trim().max(500).required().messages({
    "string.max": "Địa chỉ không được vượt quá 500 ký tự",
    "any.required": "Địa chỉ là bắt buộc",
    "string.empty": "Địa chỉ là bắt buộc",
  }),
});

export const LookupDangKyTiepDanRequest = Joi.object({
  receptionCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9-]{4,50}$/)
    .messages({
      "string.pattern.base": "Mã tiếp dân không hợp lệ",
    }),
  phoneNumber: Joi.string().trim().pattern(vietnamesePhoneRegex).messages({
    "string.pattern.base": "Số điện thoại Việt Nam không hợp lệ",
  }),
})
  .xor("receptionCode", "phoneNumber")
  .messages({
    "object.missing": "Phải nhập mã tiếp dân hoặc số điện thoại",
    "object.xor": "Chỉ được tra cứu bằng mã tiếp dân hoặc số điện thoại",
  });

export const GetDangKyTiepDanQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow("").optional(),
  receptionDate: Joi.date().iso().optional().messages({
    "date.format": "Ngày tiếp dân phải có định dạng YYYY-MM-DD",
  }),
  approvalStatus: Joi.string().trim().uppercase().max(30).optional(),
  ratingStatus: Joi.string()
    .valid("RATED", "NOT_RATED")
    .optional()
    .messages({ "any.only": "Trạng thái đánh giá không hợp lệ" }),
  department: Joi.string()
    .pattern(/^QUAY_[1-8]$/)
    .optional()
    .messages({ "string.pattern.base": "Bộ phận phải từ QUAY_1 đến QUAY_8" }),
});
