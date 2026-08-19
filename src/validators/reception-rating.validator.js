import Joi from "joi";
import { RECEPTION_RATING_COMMENT_MAX_LENGTH } from "../constants/reception-rating.constant.js";

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
  score: Joi.number().integer().min(1).max(5).required().messages({
    "number.min": "Điểm đánh giá phải từ 1 đến 5",
    "number.max": "Điểm đánh giá phải từ 1 đến 5",
    "any.required": "Điểm đánh giá là bắt buộc",
  }),
  selectedSuggestions: Joi.array()
    .items(Joi.string().trim().max(200))
    .unique()
    .max(5)
    .default([])
    .messages({
      "array.unique": "Gợi ý đánh giá không được trùng nhau",
      "array.max": "Chỉ được chọn tối đa 5 gợi ý",
    }),
  comment: Joi.string()
    .trim()
    .max(RECEPTION_RATING_COMMENT_MAX_LENGTH)
    .allow("")
    .default("")
    .messages({
      "string.max": `Nhận xét không được vượt quá ${RECEPTION_RATING_COMMENT_MAX_LENGTH} ký tự`,
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
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
});
