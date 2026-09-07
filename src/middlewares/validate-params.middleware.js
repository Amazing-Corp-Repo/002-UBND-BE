import { BaseError } from "../utils/base-error.util.js";

const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((item) => ({
      field: item.path.join("."),
      message: item.message,
    }));
    throw new BaseError(400, "Dữ liệu không hợp lệ", details);
  }

  req.validatedParams = value;
  next();
};

export default validateParams;
