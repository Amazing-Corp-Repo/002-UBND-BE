import Joi from "joi";

export const ReceptionCounterParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID quầy tiếp dân không hợp lệ",
    "any.required": "ID quầy tiếp dân là bắt buộc",
  }),
});
