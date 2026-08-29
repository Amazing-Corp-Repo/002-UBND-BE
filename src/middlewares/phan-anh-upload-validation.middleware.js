import { BaseError } from "../utils/base-error.util.js";

export const requirePhanAnhImage = (req, _res, next) => {
  const uploadedFiles = Array.isArray(req.files)
    ? req.files
    : Object.values(req.files || {}).flat();

  if (uploadedFiles.length === 0) {
    return next(new BaseError(400, "Vui lòng đính kèm ít nhất một hình ảnh"));
  }

  return next();
};
