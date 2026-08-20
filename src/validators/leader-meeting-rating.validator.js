import Joi from "joi";
import { LEADER_MEETING_RATING_COMMENT_MAX_LENGTH } from "../constants/leader-meeting-rating.constant.js";

export const CreateLeaderMeetingRatingRequest = Joi.object({
  registrationCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^LD\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "Mã đăng ký gặp lãnh đạo không hợp lệ",
      "any.required": "Mã đăng ký gặp lãnh đạo là bắt buộc",
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
    .max(LEADER_MEETING_RATING_COMMENT_MAX_LENGTH)
    .allow("")
    .default("")
    .messages({
      "string.max": `Nhận xét không được vượt quá ${LEADER_MEETING_RATING_COMMENT_MAX_LENGTH} ký tự`,
    }),
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

export const GetLeaderMeetingRatingsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow("").optional(),
  score: Joi.number().integer().min(1).max(5).optional(),
  leaderId: Joi.string().uuid().optional().messages({
    "string.guid": "ID lãnh đạo không hợp lệ",
  }),
  fromDate: ratingDate.optional(),
  toDate: ratingDate.optional(),
});

export const GetLeaderMeetingRatingStatisticsQuery = Joi.object({
  leaderId: Joi.string().uuid().optional().messages({
    "string.guid": "ID lãnh đạo không hợp lệ",
  }),
  fromDate: ratingDate.optional(),
  toDate: ratingDate.optional(),
});
