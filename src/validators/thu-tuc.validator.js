import Joi from 'joi';

// Validator cho tham số query 'page' và 'size'
export const GetThuTucQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  size: Joi.number().integer().min(1).max(100).default(10), // Giới hạn max size là 100  để tránh tải quá nhiều dữ liệu
});

// Validator cho ID trong URL params
export const ThuTucIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(), // Nếu ID của bạn là UUID
  // Hoặc nếu ID là số nguyên: id: Joi.number().integer().min(1).required(),
});