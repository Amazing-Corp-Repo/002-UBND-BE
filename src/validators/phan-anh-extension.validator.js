import Joi from "joi";
import PHAN_ANH_EXTENSION_STATUS from "../constants/phan-anh-extension-status.constant.js";

export const CreatePhanAnhExtensionRequest = Joi.object({
  complaintId: Joi.string().uuid().required().messages({
    "string.guid": "complaintId không hợp lệ",
    "any.required": "complaintId là bắt buộc",
  }),
  requestedDeadline: Joi.string().isoDate().required().messages({
    "string.isoDate": "requestedDeadline không hợp lệ",
    "any.required": "requestedDeadline là bắt buộc",
  }),
  reason: Joi.string().trim().min(5).max(4000).required().messages({
    "string.min": "Lý do gia hạn phải có ít nhất 5 ký tự",
    "string.max": "Lý do gia hạn không được vượt quá 4000 ký tự",
    "any.required": "Lý do gia hạn là bắt buộc",
  }),
});

export const GetPhanAnhExtensionsQuery = Joi.object({
  status: Joi.string().valid("ALL", ...Object.values(PHAN_ANH_EXTENSION_STATUS)).default("ALL"),
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(255).optional().allow(""),
  mucDo: Joi.string().valid("KHAN_CAP", "BINH_THUONG", "Khẩn cấp", "Thông thường").optional(),
  idLinhVuc: Joi.string().uuid().optional(),
});

export const PhanAnhExtensionIdParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID đề nghị gia hạn không hợp lệ",
    "any.required": "ID đề nghị gia hạn là bắt buộc",
  }),
});

export const ApprovePhanAnhExtensionRequest = Joi.object({
  ghiChu: Joi.string().trim().max(2000).optional().allow(""),
});

export const RejectPhanAnhExtensionRequest = Joi.object({
  lyDoTuChoi: Joi.string().trim().min(5).max(4000).required().messages({
    "string.min": "Lý do từ chối phải có ít nhất 5 ký tự",
    "string.max": "Lý do từ chối không được vượt quá 4000 ký tự",
    "any.required": "Lý do từ chối là bắt buộc",
  }),
});
