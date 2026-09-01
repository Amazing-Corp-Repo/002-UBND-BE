import Joi from "joi";

const vietnameseNameRegex = /^[\p{L}\s'.-]+$/u;
const vietnamesePhoneRegex = /^(03|05|07|08|09)\d{8}$/;

const optionalDate = Joi.string()
  .trim()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const isValid = date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
    if (!isValid) return helpers.error("date.invalid");

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    return value <= today ? value : helpers.error("date.future");
  })
  .messages({
    "string.pattern.base": "Ngày cấp CCCD phải có định dạng YYYY-MM-DD",
    "date.invalid": "Ngày cấp CCCD không tồn tại",
    "date.future": "Ngày cấp CCCD không được lớn hơn ngày hiện tại",
  });

const applicationDate = Joi.string()
  .trim()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const isValid = date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
    if (!isValid) return helpers.error("date.invalid");

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    return value <= today ? value : helpers.error("date.future");
  })
  .required()
  .messages({
    "string.pattern.base": "Ngày làm đơn phải có định dạng YYYY-MM-DD",
    "string.empty": "Ngày làm đơn là bắt buộc",
    "any.required": "Ngày làm đơn là bắt buộc",
    "date.invalid": "Ngày làm đơn không tồn tại",
    "date.future": "Ngày làm đơn không được lớn hơn ngày hiện tại",
  });

export const EmptyLeaderMeetingRequest = Joi.object({}).max(0).messages({
  "object.max": "Yêu cầu này không nhận dữ liệu body",
  "object.unknown": "Trường {#label} không được hỗ trợ",
});

export const CreateLeaderMeetingRegistrationRequest = Joi.object({
  slotId: Joi.string().uuid().required().messages({
    "string.guid": "ID khung giờ gặp lãnh đạo không hợp lệ",
    "any.required": "ID khung giờ gặp lãnh đạo là bắt buộc",
  }),
  fullName: Joi.string()
    .trim()
    .min(4)
    .max(150)
    .pattern(vietnameseNameRegex)
    .required()
    .messages({
      "string.pattern.base": "Họ tên chỉ được chứa chữ cái và khoảng trắng",
      "string.min": "Họ tên phải có ít nhất 4 ký tự",
      "string.max": "Họ tên không được vượt quá 150 ký tự",
      "string.empty": "Họ tên là bắt buộc",
      "any.required": "Họ tên là bắt buộc",
    }),
  phoneNumber: Joi.string().trim().pattern(vietnamesePhoneRegex).required().messages({
    "string.pattern.base": "Số điện thoại Việt Nam không hợp lệ",
    "any.required": "Số điện thoại là bắt buộc",
  }),
  citizenId: Joi.string().trim().pattern(/^\d{12}$/).required().messages({
    "string.pattern.base": "Số định danh cá nhân phải gồm đúng 12 chữ số",
    "any.required": "Số định danh cá nhân là bắt buộc",
  }),
  citizenIdIssuedDate: optionalDate.optional().allow(""),
  citizenIdIssuedPlace: Joi.string().trim().min(3).max(255).optional().allow("").messages({
    "string.min": "Nơi cấp CCCD phải có ít nhất 3 ký tự",
    "string.max": "Nơi cấp CCCD không được vượt quá 255 ký tự",
  }),
  applicationDate,
  address: Joi.string().trim().min(6).max(500).required().messages({
    "string.min": "Địa chỉ phải có ít nhất 6 ký tự",
    "string.max": "Địa chỉ không được vượt quá 500 ký tự",
    "string.empty": "Địa chỉ là bắt buộc",
    "any.required": "Địa chỉ là bắt buộc",
  }),
  reason: Joi.string().trim().min(10).max(2000).required().messages({
    "string.min": "Lý do gặp phải có ít nhất 10 ký tự",
    "string.max": "Lý do gặp không được vượt quá 2000 ký tự",
    "string.empty": "Lý do gặp là bắt buộc",
    "any.required": "Lý do gặp là bắt buộc",
  }),
});

export const LookupLeaderMeetingRegistrationRequest = Joi.object({
  registrationCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^LD\d{6}$/)
    .messages({
      "string.pattern.base": "Mã đăng ký gặp lãnh đạo không hợp lệ",
    }),
  phoneNumber: Joi.string().trim().pattern(vietnamesePhoneRegex).messages({
    "string.pattern.base": "Số điện thoại Việt Nam không hợp lệ",
  }),
})
  .xor("registrationCode", "phoneNumber")
  .messages({
    "object.missing": "Phải nhập mã đăng ký hoặc số điện thoại",
    "object.xor": "Chỉ được tra cứu bằng mã đăng ký hoặc số điện thoại",
  });

const receptionDateFilter = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
      ? value
      : helpers.error("date.invalid");
  })
  .messages({
    "string.pattern.base": "Ngày lọc phải có định dạng YYYY-MM-DD",
    "date.invalid": "Ngày lọc không tồn tại",
  });

export const GetLeaderMeetingRegistrationsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow("").optional(),
  status: Joi.string()
    .valid("PENDING", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELED", "OVERDUE")
    .optional()
    .messages({ "any.only": "Trạng thái đăng ký không hợp lệ" }),
  leaderId: Joi.string().uuid().optional().messages({
    "string.guid": "ID lãnh đạo không hợp lệ",
  }),
  fromDate: receptionDateFilter.optional(),
  toDate: receptionDateFilter.optional(),
}).custom((value, helpers) => {
  if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
    return helpers.error("date.range");
  }
  return value;
}).messages({
  "date.range": "Từ ngày không được lớn hơn đến ngày",
});

export const LeaderMeetingRegistrationIdParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID đăng ký gặp lãnh đạo không hợp lệ",
    "any.required": "ID đăng ký gặp lãnh đạo là bắt buộc",
  }),
});

export const RejectLeaderMeetingRegistrationRequest = Joi.object({
  reason: Joi.string().trim().min(5).max(2000).required().messages({
    "string.empty": "Lý do từ chối là bắt buộc",
    "string.min": "Lý do từ chối phải có ít nhất 5 ký tự",
    "string.max": "Lý do từ chối không được vượt quá 2000 ký tự",
    "any.required": "Lý do từ chối là bắt buộc",
  }),
});

export const ProcessLeaderMeetingRegistrationRequest = Joi.object({
  note: Joi.string().trim().max(2000).allow("", null).optional().messages({
    "string.max": "Ghi chú xử lý không được vượt quá 2000 ký tự",
  }),
});

export const CompleteLeaderMeetingRegistrationRequest = Joi.object({
  note: Joi.string().trim().min(1).max(2000).required().messages({
    "string.empty": "Kết quả xử lý là bắt buộc",
    "string.min": "Kết quả xử lý là bắt buộc",
    "string.max": "Ghi chú hoàn thành không được vượt quá 2000 ký tự",
    "any.required": "Kết quả xử lý là bắt buộc",
  }),
});

export const CancelLeaderMeetingRegistrationRequest = Joi.object({
  reason: Joi.string().trim().min(5).max(2000).required().messages({
    "string.empty": "Lý do hủy là bắt buộc",
    "string.min": "Lý do hủy phải có ít nhất 5 ký tự",
    "string.max": "Lý do hủy không được vượt quá 2000 ký tự",
    "any.required": "Lý do hủy là bắt buộc",
  }),
});

export const LeaderMeetingAttachmentParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID đăng ký gặp lãnh đạo không hợp lệ",
    "any.required": "ID đăng ký gặp lãnh đạo là bắt buộc",
  }),
  attachmentId: Joi.string().uuid().required().messages({
    "string.guid": "ID tệp đính kèm không hợp lệ",
    "any.required": "ID tệp đính kèm là bắt buộc",
  }),
});

export const GetLeaderMeetingAttachmentQuery = Joi.object({
  download: Joi.boolean().truthy("true").falsy("false").default(false),
});
