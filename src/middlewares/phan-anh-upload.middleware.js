import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";
import fs from "fs-extra";
import { BaseError } from "../utils/base-error.util.js";
import { cleanOriginalFileName, toSnakeCaseNonAccent } from "../utils/string.util.js";

const UPLOAD_ROOT = path.join(
  process.cwd(),
  "src",
  "public",
  "uploads",
  "PHAN_ANH",
);

const IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const STATUS_UPDATE_TYPES = new Set([
  ...IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const cleanupFiles = async (files = []) => {
  await Promise.all(files.map((file) => fs.remove(file.path).catch(() => {})));
};

const createPhanAnhUploader = ({ maxSizeMB, allowedTypes }) => {
  const storage = multer.diskStorage({
    destination: async (req, _file, callback) => {
      try {
        if (!req.phanAnhUploadFolder) {
          const dateFolder = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
          }).format(new Date());
          req.phanAnhUploadFolder = path.join(UPLOAD_ROOT, dateFolder);
          await fs.ensureDir(req.phanAnhUploadFolder);
        }
        callback(null, req.phanAnhUploadFolder);
      } catch (error) {
        callback(error);
      }
    },
    filename: (_req, file, callback) => {
      const originalName = cleanOriginalFileName(file.originalname);
      const extension = path.extname(originalName).toLowerCase();
      const baseName = toSnakeCaseNonAccent(path.basename(originalName, extension));
      callback(null, `${baseName || "file"}-${randomUUID()}${extension}`);
    },
  });

  const uploader = multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024, files: 5 },
    fileFilter: (_req, file, callback) => {
      const allowed = allowedTypes.has(file.mimetype);
      callback(allowed ? null : new BaseError(400, "File không hợp lệ"), allowed);
    },
  }).array("file", 5);

  return (req, res, next) => {
    uploader(req, res, async (error) => {
      if (error) {
        await cleanupFiles(req.files || []);
        if (error instanceof multer.MulterError) {
          const message =
            error.code === "LIMIT_FILE_SIZE"
              ? `File vượt quá dung lượng cho phép (${maxSizeMB}MB)`
              : "Chỉ được upload tối đa 5 tệp";
          return next(new BaseError(400, message));
        }
        return next(error);
      }

      const files = req.files || [];
      for (const file of files) {
        const relativePath = path.relative(
          path.join(process.cwd(), "src", "public"),
          file.path,
        ).replace(/\\/g, "/");
        file.relativeUrl = `/${relativePath}`;
        file.sizeMB = +(file.size / (1024 * 1024)).toFixed(2);
      }

      res.on("finish", () => {
        if (res.statusCode >= 400) void cleanupFiles(files);
      });
      return next();
    });
  };
};

export const phanAnhCreateUpload = createPhanAnhUploader({
  maxSizeMB: 10,
  allowedTypes: IMAGE_TYPES,
});

export const phanAnhStatusUpdateUpload = createPhanAnhUploader({
  maxSizeMB: 10,
  allowedTypes: STATUS_UPDATE_TYPES,
});
