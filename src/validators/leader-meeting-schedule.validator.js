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
