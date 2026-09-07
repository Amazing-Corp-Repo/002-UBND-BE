import Joi from "joi";

export const ReceptionCounterParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID quầy tiếp dân không hợp lệ",
    "any.required": "ID quầy tiếp dân là bắt buộc",
  }),
});

export const UpdateReceptionCounterRequest = Joi.object({
  counterName: Joi.string().trim().max(100).optional().messages({
    "string.empty": "Tên quầy không được để trống",
    "string.max": "Tên quầy không được vượt quá 100 ký tự",
  }),
  description: Joi.string().allow("", null).optional(),
  defaultCapacity: Joi.number().integer().min(1).optional().messages({
    "number.base": "Sức chứa mặc định phải là số",
    "number.integer": "Sức chứa mặc định phải là số nguyên",
    "number.min": "Sức chứa mặc định phải từ 1 trở lên",
  }),
  location: Joi.string().trim().max(255).allow("", null).optional().messages({
    "string.max": "Vị trí không được vượt quá 255 ký tự",
  }),
  isActive: Joi.boolean().optional(),
})
  .min(1)
  .messages({ "object.min": "Phải cung cấp ít nhất một trường cần cập nhật" });
