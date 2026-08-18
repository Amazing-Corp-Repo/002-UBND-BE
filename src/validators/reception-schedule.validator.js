import Joi from "joi";

export const GetReceptionSchedulesQuery = Joi.object({
  fromDate: Joi.date().iso().optional().messages({
    "date.format": "Ngày bắt đầu phải có định dạng YYYY-MM-DD",
  }),
  toDate: Joi.date().iso().optional().messages({
    "date.format": "Ngày kết thúc phải có định dạng YYYY-MM-DD",
  }),
});

export const ReceptionScheduleSlotParams = Joi.object({
  scheduleId: Joi.string().uuid().required().messages({
    "string.guid": "ID lịch tiếp dân không hợp lệ",
    "any.required": "ID lịch tiếp dân là bắt buộc",
  }),
  slotId: Joi.string().uuid().required().messages({
    "string.guid": "ID cấu hình quầy không hợp lệ",
    "any.required": "ID cấu hình quầy là bắt buộc",
  }),
});

export const UpdateReceptionSlotCapacityRequest = Joi.object({
  capacity: Joi.number().integer().min(1).required().messages({
    "number.base": "Sức chứa phải là số",
    "number.integer": "Sức chứa phải là số nguyên",
    "number.min": "Sức chứa phải từ 1 trở lên",
    "any.required": "Sức chứa là bắt buộc",
  }),
});
