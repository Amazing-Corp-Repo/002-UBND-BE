import Joi from "joi";

export const GetReceptionSchedulesQuery = Joi.object({
  fromDate: Joi.date().iso().optional().messages({
    "date.format": "Ngày bắt đầu phải có định dạng YYYY-MM-DD",
  }),
  toDate: Joi.date().iso().optional().messages({
    "date.format": "Ngày kết thúc phải có định dạng YYYY-MM-DD",
  }),
});
