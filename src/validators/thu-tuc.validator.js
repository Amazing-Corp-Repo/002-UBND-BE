import Joi from "joi";

export const SearchThuTucQuery = Joi.object({
  keyword: Joi.string()
    .trim()
    .max(255)
    .allow("", null)
    .messages({
      "string.max": "Từ khoá tìm kiếm không được vượt quá 255 ký tự",
    }),
  linhVucId: Joi.string()
    .trim()
    .guid({ version: ["uuidv4"] })
    .allow("", null)
    .messages({
      "string.guid": "Lĩnh vực không hợp lệ",
    }),
});
