import Joi from "joi";
import {
  RECEPTION_RATING_COMMENT_MAX_LENGTH,
} from "../constants/reception-rating.constant.js";

const receptionDateSchema = (fieldLabel) =>
  Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
      }
      const date = new Date(`${value}T00:00:00.000Z`);
      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        return helpers.error("date.invalid");
      }
      return value;
    })
    .messages({
      "string.pattern.base": `${fieldLabel} phải có định dạng YYYY-MM-DD`,
      "date.invalid": `${fieldLabel} không tồn tại`,
    });

export const CreateReceptionRatingRequest = Joi.object({
  receptionCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9-]{4,50}$/)
    .required()
    .messages({
      "string.pattern.base": "Mã tiếp dân không hợp lệ",
      "any.required": "Mã tiếp dân là bắt buộc",
    }),
  citizenName: Joi.string().trim().min(2).max(150).required().messages({
    "string.min": "Tên người dân phải có ít nhất 2 ký tự",
    "string.max": "Tên người dân không được vượt quá 150 ký tự",
    "string.empty": "Tên người dân là bắt buộc",
    "any.required": "Tên người dân là bắt buộc",
  }),
  officerName: Joi.string().trim().min(2).max(150).required().messages({
    "string.min": "Tên cán bộ phải có ít nhất 2 ký tự",
    "string.max": "Tên cán bộ không được vượt quá 150 ký tự",
    "string.empty": "Tên cán bộ là bắt buộc",
    "any.required": "Tên cán bộ là bắt buộc",
  }),
  counterCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^QUAY_[1-8]$/)
    .required()
    .messages({
      "string.pattern.base": "Mã quầy phải từ QUAY_1 đến QUAY_8",
      "any.required": "Mã quầy là bắt buộc",
    }),
  receptionDate: receptionDateSchema("Ngày tiếp dân").required().messages({
    "any.required": "Ngày tiếp dân là bắt buộc",
  }),
  timeSlot: Joi.string()
    .trim()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d\s-\s([01]\d|2[0-3]):[0-5]\d$/)
    .custom((value, helpers) => {
      const [start, end] = value.split(" - ");
      return start < end ? value : helpers.error("time.range");
    })
    .required()
    .messages({
      "string.pattern.base": "Khung giờ phải có định dạng HH:mm - HH:mm",
      "time.range": "Giờ bắt đầu phải nhỏ hơn giờ kết thúc",
      "any.required": "Khung giờ là bắt buộc",
    }),
  workingContent: Joi.string()
    .trim()
    .required()
    .messages({
      "string.empty": "Nội dung làm việc là bắt buộc",
      "any.required": "Nội dung làm việc là bắt buộc",
    }),
  score: Joi.number().integer().min(1).max(5).required().messages({
    "number.min": "Điểm đánh giá phải từ 1 đến 5",
    "number.max": "Điểm đánh giá phải từ 1 đến 5",
    "any.required": "Điểm đánh giá là bắt buộc",
  }),
  comment: Joi.string()
    .trim()
    .min(1)
    .max(RECEPTION_RATING_COMMENT_MAX_LENGTH)
    .required()
    .messages({
      "string.empty": "Nhận xét là bắt buộc",
      "string.max": `Nhận xét không được vượt quá ${RECEPTION_RATING_COMMENT_MAX_LENGTH} ký tự`,
      "any.required": "Nhận xét là bắt buộc",
    }),
});

export const GetReceptionRatingsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow("").optional(),
  score: Joi.number().integer().min(1).max(5).optional(),
  department: Joi.string()
    .pattern(/^QUAY_[1-8]$/)
    .optional()
    .messages({ "string.pattern.base": "Bộ phận phải từ QUAY_1 đến QUAY_8" }),
  fromDate: receptionDateSchema("Ngày bắt đầu").optional(),
  toDate: receptionDateSchema("Ngày kết thúc").optional(),
});

export const ReceptionRatingIdParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID đánh giá tiếp dân không hợp lệ",
    "any.required": "ID đánh giá tiếp dân là bắt buộc",
  }),
});

export const GetReceptionRatingStatisticsQuery = Joi.object({
  department: Joi.string()
    .pattern(/^QUAY_[1-8]$/)
    .optional()
    .messages({ "string.pattern.base": "Bộ phận phải từ QUAY_1 đến QUAY_8" }),
  fromDate: receptionDateSchema("Ngày bắt đầu").optional(),
  toDate: receptionDateSchema("Ngày kết thúc").optional(),
});
