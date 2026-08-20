import Joi from "joi";

const dateSchema = (label) =>
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

export const GetLeaderMeetingSchedulesQuery = Joi.object({
  fromDate: dateSchema("Ngày bắt đầu").optional(),
  toDate: dateSchema("Ngày kết thúc").optional(),
  leaderId: Joi.string().uuid().optional().messages({
    "string.guid": "ID lãnh đạo không hợp lệ",
  }),
});

export const GetLeaderMeetingScheduleManagementQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().min(1).max(100).default(10),
  fromDate: dateSchema("Ngày bắt đầu").optional(),
  toDate: dateSchema("Ngày kết thúc").optional(),
  isActive: Joi.boolean().truthy("true").falsy("false").optional(),
  search: Joi.string().trim().max(100).allow("").optional(),
});

export const LeaderMeetingScheduleIdParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID lịch gặp lãnh đạo không hợp lệ",
    "any.required": "ID lịch gặp lãnh đạo là bắt buộc",
  }),
});

const leaderMeetingSlotSchema = Joi.object({
  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base": "Giờ bắt đầu phải có định dạng HH:mm",
      "any.required": "Giờ bắt đầu là bắt buộc",
    }),
  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base": "Giờ kết thúc phải có định dạng HH:mm",
      "any.required": "Giờ kết thúc là bắt buộc",
    }),
});

export const CreateLeaderMeetingScheduleRequest = Joi.object({
  receptionDate: dateSchema("Ngày gặp lãnh đạo").required().messages({
    "any.required": "Ngày gặp lãnh đạo là bắt buộc",
  }),
  location: Joi.string().trim().max(255).optional().allow("", null),
  note: Joi.string().trim().max(2000).optional().allow("", null),
  slots: Joi.array().items(leaderMeetingSlotSchema).min(1).max(20).required().messages({
    "array.min": "Phải có ít nhất một khung giờ",
    "array.max": "Một lịch chỉ được có tối đa 20 khung giờ",
    "any.required": "Danh sách khung giờ là bắt buộc",
  }),
});

export const UpdateLeaderMeetingScheduleRequest = CreateLeaderMeetingScheduleRequest;

export const UpdateLeaderMeetingScheduleStatusRequest = Joi.object({
  isActive: Joi.boolean().required().messages({
    "boolean.base": "Trạng thái hoạt động phải là true hoặc false",
    "any.required": "Trạng thái hoạt động là bắt buộc",
  }),
});
