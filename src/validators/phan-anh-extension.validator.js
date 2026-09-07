import Joi from "joi";

const videoIds = Joi.array()
  .items(Joi.string().trim().min(1).max(255))
  .max(5)
  .unique()
  .single()
  .default([]);

export const CreatePhanAnhExtensionRequest = Joi.object({
  lyDo: Joi.string().trim().min(10).max(2000).required().messages({
    "string.min": "Lý do gia hạn phải có ít nhất 10 ký tự",
    "string.max": "Lý do gia hạn không được vượt quá 2000 ký tự",
    "any.required": "Lý do gia hạn là bắt buộc",
  }),
  ngayDeXuatHoanThanh: Joi.date().iso().greater("now").required().messages({
    "date.format": "Ngày đề xuất hoàn thành phải theo chuẩn ISO 8601",
    "date.greater": "Ngày đề xuất hoàn thành phải ở tương lai",
    "any.required": "Ngày đề xuất hoàn thành là bắt buộc",
  }),
  idVideo: videoIds,
});

export const RejectPhanAnhExtensionRequest = Joi.object({
  lyDoTuChoi: Joi.string().trim().min(3).max(2000).required().messages({
    "string.min": "Lý do từ chối phải có ít nhất 3 ký tự",
    "string.max": "Lý do từ chối không được vượt quá 2000 ký tự",
    "any.required": "Lý do từ chối là bắt buộc để bảo đảm minh bạch",
  }),
});

export const PhanAnhExtensionIdParams = Joi.object({
  idPhanAnh: Joi.string().uuid().required().messages({
    "string.guid": "ID phản ánh không hợp lệ",
    "any.required": "ID phản ánh là bắt buộc",
  }),
});

export const GetAllPhanAnhExtensionQuery = Joi.object({
  trangThai: Joi.string().valid("PENDING", "APPROVED", "REJECTED").optional(),
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().min(1).max(100).default(10),
});
