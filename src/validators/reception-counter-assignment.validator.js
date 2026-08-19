import Joi from "joi";

export const GetReceptionCounterAssignmentsQuery = Joi.object({
  shiftId: Joi.string().uuid().optional().messages({ "string.guid": "ID ca tiếp dân không hợp lệ" }),
  counterId: Joi.string().uuid().optional().messages({ "string.guid": "ID quầy không hợp lệ" }),
  officerId: Joi.string().uuid().optional().messages({ "string.guid": "ID cán bộ không hợp lệ" }),
  isActive: Joi.boolean().optional(),
});

export const ReceptionCounterAssignmentParams = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.guid": "ID phân công quầy không hợp lệ",
    "any.required": "ID phân công quầy là bắt buộc",
  }),
});
