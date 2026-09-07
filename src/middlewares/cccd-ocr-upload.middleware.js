import multer from "multer";
import { BaseError } from "../utils/base-error.util.js";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = IMAGE_TYPES.has(file.mimetype);
    callback(allowed ? null : new BaseError(400, "Ảnh CCCD không hợp lệ"), allowed);
  },
}).single("image");

export const cccdOcrUpload = (req, res, next) => {
  uploader(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new BaseError(400, "Ảnh CCCD không được vượt quá 10MB"));
    }
    if (error) return next(error);
    if (!req.file) return next(new BaseError(400, "Vui lòng gửi ảnh CCCD"));
    return next();
  });
};
