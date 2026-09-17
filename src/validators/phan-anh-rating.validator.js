import Joi from "joi";
import { PHAN_ANH_RATING_COMMENT_MAX_LENGTH } from "../constants/phan-anh-rating.constant.js";

const complaintCode = Joi.string()
  .trim()
  .uppercase()
  .pattern(/^[A-Z0-9]{8}$/)
  .required()
  .messages({
    "string.pattern.base": "Mã phản ánh không hợp lệ",
    "any.required": "Mã phản ánh là bắt buộc",
  });

const ratingDate = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
      ? value
      : helpers.error("date.invalid");
  })
  .messages({
    "string.pattern.base": "Ngày lọc phải có định dạng YYYY-MM-DD",
    "date.invalid": "Ngày lọc không tồn tại",
  });

const validateDateRange = (value, helpers) => {
  if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
    return helpers.error("date.range");
  }
  return value;
};

export const CreatePhanAnhRatingRequest = Joi.object({
  complaintCode,
  score: Joi.number().integer().min(1).max(5).required().messages({
    "number.min": "Điểm đánh giá phải từ 1 đến 5",
    "number.max": "Điểm đánh giá phải từ 1 đến 5",
    "any.required": "Điểm đánh giá là bắt buộc",
  }),
  comment: Joi.string()
    .trim()
    .max(PHAN_ANH_RATING_COMMENT_MAX_LENGTH)
    .allow("")
    .default("")
    .messages({
      "string.max": `Nhận xét không được vượt quá ${PHAN_ANH_RATING_COMMENT_MAX_LENGTH} ký tự`,
    }),
});

export const GetPhanAnhRatingsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow("").optional(),
  score: Joi.number().integer().min(1).max(5).optional(),
  idLinhVucPhanAnh: Joi.string().uuid().optional().messages({
    "string.guid": "ID lĩnh vực phản ánh không hợp lệ",
  }),
  fromDate: ratingDate.optional(),
  toDate: ratingDate.optional(),
}).custom(validateDateRange).messages({
  "date.range": "Từ ngày không được lớn hơn đến ngày",
});

export const GetPhanAnhRatingStatisticsQuery = Joi.object({
  idLinhVucPhanAnh: Joi.string().uuid().optional().messages({
    "string.guid": "ID lĩnh vực phản ánh không hợp lệ",
  }),
  fromDate: ratingDate.optional(),
  toDate: ratingDate.optional(),
}).custom(validateDateRange).messages({
  "date.range": "Từ ngày không được lớn hơn đến ngày",
});

export const PhanAnhRatingIdParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID đánh giá phản ánh không hợp lệ",
    "any.required": "ID đánh giá phản ánh là bắt buộc",
  }),
});

export const PhanAnhRatingCodeParams = Joi.object({ complaintCode });
