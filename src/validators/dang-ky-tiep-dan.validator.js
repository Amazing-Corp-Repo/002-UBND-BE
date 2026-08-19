import Joi from "joi";

const vietnameseNameRegex = /^[\p{L}\s'.-]+$/u;
const vietnamesePhoneRegex = /^(03|05|07|08|09)\d{8}$/;
const timeSlotRegex = /^([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d$/;

const receptionDateSchema = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return helpers.error("date.invalid");
    }
    return value;
  })
  .messages({
    "string.pattern.base": "Ngày tiếp dân phải có định dạng YYYY-MM-DD",
    "date.invalid": "Ngày tiếp dân không tồn tại",
  });

export const CreateDangKyTiepDanRequest = Joi.object({
  idLichTiepDan: Joi.string().uuid().required().messages({
    "string.guid": "ID lịch tiếp dân không hợp lệ",
    "any.required": "ID lịch tiếp dân là bắt buộc",
  }),
  slotId: Joi.string().uuid().optional().messages({
    "string.guid": "ID khung giờ tiếp dân không hợp lệ",
  }),
  slot: Joi.string().trim().pattern(timeSlotRegex).optional().messages({
    "string.pattern.base": "Khung giờ phải có dạng HH:mm - HH:mm",
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
})
  .or("slotId", "slot")
  .messages({
    "object.missing": "Phải cung cấp ID khung giờ hoặc chuỗi khung giờ",
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
  receptionDate: receptionDateSchema.optional(),
  approvalStatus: Joi.string()
    .trim()
    .uppercase()
    .valid("PENDING", "APPROVED", "COMPLETED", "REJECTED")
    .optional()
    .messages({ "any.only": "Trạng thái phê duyệt không hợp lệ" }),
  ratingStatus: Joi.string()
    .valid("RATED", "NOT_RATED")
    .optional()
    .messages({ "any.only": "Trạng thái đánh giá không hợp lệ" }),
  department: Joi.string()
    .pattern(/^QUAY_[1-8]$/)
    .optional()
    .messages({ "string.pattern.base": "Bộ phận phải từ QUAY_1 đến QUAY_8" }),
});

export const ReceptionRegistrationIdParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID đăng ký tiếp dân không hợp lệ",
    "any.required": "ID đăng ký tiếp dân là bắt buộc",
  }),
});

export const ReceptionCodeParams = Joi.object({
  receptionCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9-]{4,50}$/)
    .required()
    .messages({
      "string.pattern.base": "Mã tiếp dân không hợp lệ",
      "any.required": "Mã tiếp dân là bắt buộc",
    }),
});

export const ApproveReceptionRegistrationRequest = Joi.object({
  department: Joi.string()
    .pattern(/^QUAY_[1-8]$/)
    .required()
    .messages({
      "string.pattern.base": "Bộ phận phải từ QUAY_1 đến QUAY_8",
      "any.required": "Bộ phận tiếp nhận là bắt buộc",
    }),
});

export const RejectReceptionRegistrationRequest = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required().messages({
    "string.min": "Lý do từ chối phải có ít nhất 5 ký tự",
    "string.max": "Lý do từ chối không được vượt quá 500 ký tự",
    "string.empty": "Lý do từ chối là bắt buộc",
    "any.required": "Lý do từ chối là bắt buộc",
  }),
});
