import Joi from "joi";

export const CreateLinhVucPhanAnhRequest = Joi.object({
  ten: Joi.string().max(255).required().messages({
    "string.base": `Tên lĩnh vực phản ánh phải là một chuỗi`,
    "string.empty": `Tên lĩnh vực phản ánh không được để trống`,
    "string.max": `Tên lĩnh vực phản ánh không được vượt quá 255 ký tự`,
    "any.required": `Tên lĩnh vực phản ánh là trường bắt buộc`,
  }),
  moTa: Joi.string().optional().allow(null, "").messages({
    "string.base": `Mô tả phải là một chuỗi`,
  }),
  nguoiQuanLyIds: Joi.array()
    .items(
      Joi.string().uuid().required().messages({
        "string.base": "ID người quản lý phải là chuỗi",
        "string.empty": "ID người quản lý không được để trống",
        "string.guid": "ID người quản lý phải là UUID hợp lệ",
        "any.required": "ID người quản lý là bắt buộc",
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": `Danh sách người quản lý phải là một mảng`,
      "array.min": `Danh sách người quản lý phải có ít nhất 1 phần tử`,
      "any.required": `Danh sách người quản lý là trường bắt buộc`,
    }),
});

export const UpdateLinhVucPhanAnhRequest = Joi.object({
  ten: Joi.string().max(255).required().messages({
    "string.base": `Tên lĩnh vực phản ánh phải là một chuỗi`,
    "string.empty": `Tên lĩnh vực phản ánh không được để trống`,
    "string.max": `Tên lĩnh vực phản ánh không được vượt quá 255 ký tự`,
    "any.required": `Tên lĩnh vực phản ánh là trường bắt buộc`,
  }),
  moTa: Joi.string().optional().allow(null, "").messages({
    "string.base": `Mô tả phải là một chuỗi`,
  }),
  nguoiQuanLyIds: Joi.array()
    .items(
      Joi.string().uuid().required().messages({
        "string.base": "ID người quản lý phải là chuỗi",
        "string.empty": "ID người quản lý không được để trống",
        "string.guid": "ID người quản lý phải là UUID hợp lệ",
        "any.required": "ID người quản lý là bắt buộc",
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": `Danh sách người quản lý phải là một mảng`,
      "array.min": `Danh sách người quản lý phải có ít nhất 1 phần tử`,
      "any.required": `Danh sách người quản lý là trường bắt buộc`,
    }),
});

export const UpdateLinhVucPhanAnhStatusRequest = Joi.object({
  isActive: Joi.boolean().required().messages({
    "boolean.base": `Trạng thái hoạt động phải là kiểu boolean`,
    "any.required": `Trạng thái hoạt động là trường bắt buộc`,
  }),
});
