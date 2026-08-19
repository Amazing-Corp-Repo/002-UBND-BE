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

export const ReceptionShiftParams = Joi.object({
  shiftId: Joi.string().uuid().required().messages({
    "string.guid": "ID ca tiếp dân không hợp lệ",
    "any.required": "ID ca tiếp dân là bắt buộc",
  }),
});

export const ReplaceReceptionCounterAssignmentsRequest = Joi.object({
  assignments: Joi.array().items(
    Joi.object({
      counterConfigurationId: Joi.string().uuid().required().messages({
        "string.guid": "ID cấu hình quầy không hợp lệ",
        "any.required": "ID cấu hình quầy là bắt buộc",
      }),
      officerId: Joi.string().uuid().required().messages({
        "string.guid": "ID cán bộ không hợp lệ",
        "any.required": "ID cán bộ là bắt buộc",
      }),
    })
  ).required().messages({
    "array.base": "Danh sách phân công phải là một mảng",
    "any.required": "Danh sách phân công là bắt buộc",
  }),
});
