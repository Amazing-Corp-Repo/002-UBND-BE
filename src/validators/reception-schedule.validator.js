import Joi from "joi";

const receptionDateSchema = (label) =>
  Joi.string()
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
      "string.pattern.base": `${label} phải có định dạng YYYY-MM-DD`,
      "date.invalid": `${label} không tồn tại`,
    });

export const GetReceptionSchedulesQuery = Joi.object({
  fromDate: receptionDateSchema("Ngày bắt đầu").optional(),
  toDate: receptionDateSchema("Ngày kết thúc").optional(),
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
