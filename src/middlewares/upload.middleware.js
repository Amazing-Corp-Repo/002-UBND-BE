import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { BaseError } from "../utils/base-error.util.js";
import { toSnakeCaseNonAccent } from "../utils/string.util.js";
import UPLOAD_TYPE from "../constants/upload.constant.js";

const cleanupUploadFolder = async (req) => {
  if (req.uploadFolderPath && (await fs.pathExists(req.uploadFolderPath))) {
    await fs.remove(req.uploadFolderPath);
  }
};

export const createUploader = ({
  type,
  fieldName,
  maxCount = 5,
  maxSizeMB = 10,
  allowed_types = [],
  basePathSegments = ["src", "public", "uploads"],
  isPublic = true,
} = {}) => {
  if (!type || !fieldName) {
    throw new BaseError(500, "Thiếu 'type' hoặc 'fieldName' khi tạo uploader");
  }

  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        if (type !== UPLOAD_TYPE.ADDRESS_VOTE) {
          // 🕒 Dùng chung thư mục cho toàn bộ file trong 1 request
          if (!req.uploadFolderPath) {
            const now = new Date();
            const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
            const dateFolder = vnTime.toISOString().split("T")[0];
            req.uploadFolderPath = path.join(
              process.cwd(),
              ...basePathSegments,
              type,
              dateFolder,
            );
            await fs.ensureDir(req.uploadFolderPath);
          }

          cb(null, req.uploadFolderPath);
        } else {
          // 🕒 Dùng chung thư mục cho toàn bộ file trong 1 request
          if (!req.uploadFolderPath) {
            req.uploadFolderPath = path.join(
              process.cwd(),
              ...basePathSegments,
              type,
            );
            await fs.ensureDir(req.uploadFolderPath);
          }
          cb(null, req.uploadFolderPath);
        }
      } catch (err) {
        cb(err);
      }
    },

    filename: async (req, file, cb) => {
      try {
        if (type !== UPLOAD_TYPE.ADDRESS_VOTE) {
          // ✅ Fix lỗi tiếng Việt bị sai encoding
          const originalName = Buffer.from(
            file.originalname,
            "latin1",
          ).toString("utf8");
          const ext = path.extname(originalName);
          const base = path.basename(originalName, ext);

          // ✅ Chuyển thành snake_case không dấu
          const safeName = toSnakeCaseNonAccent(base);
          cb(null, `${safeName}-${Date.now()}${ext}`);
        } else {
          // ✅ Lấy đuôi file
          const originalName = Buffer.from(
            file.originalname,
            "latin1",
          ).toString("utf8");
          const ext = path.extname(originalName);
          const fileName = `address_vote_uploads${ext}`;

          // ✅ Xóa file cũ nếu tồn tại
          if (req.uploadFolderPath) {
            const oldFilePath = path.join(req.uploadFolderPath, fileName);
            if (await fs.pathExists(oldFilePath)) {
              await fs.remove(oldFilePath);
            }
          }

          cb(null, fileName);
        }
      } catch (error) {
        cb(error);
      }
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!allowed_types.includes(file.mimetype)) {
      return cb(new BaseError(400, `File không hợp lệ`));
    }
    cb(null, true);
  };

  const limits = { fileSize: maxSizeMB * 1024 * 1024 };
  const uploader = multer({ storage, fileFilter, limits }).array(
    fieldName,
    maxCount,
  );

  return (req, res, next) => {
    uploader(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        await cleanupUploadFolder(req);
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            return next(
              new BaseError(
                400,
                `File vượt quá dung lượng cho phép (${maxSizeMB}MB)`,
              ),
            );
          case "LIMIT_FILE_COUNT":
          case "LIMIT_UNEXPECTED_FILE":
            return next(
              new BaseError(400, `Chỉ được upload tối đa ${maxCount}`),
            );
          default:
            return next(new BaseError(400, err.message));
        }
      } else if (err) {
        await cleanupUploadFolder(req);
        return next(err);
      }

      req.files = (req.files || []).map((f) => {
        const sizeMB = +(f.size / (1024 * 1024)).toFixed(2);
        if (isPublic) {
          const publicDir = path.join(process.cwd(), "src", "public");
          const relativePath = path
            .relative(publicDir, f.path)
            .replace(/\\/g, "/");
          return {
            ...f,
            relativeUrl: `/${relativePath}`,
            sizeMB,
          };
        }
        // Private file: không public URL
        return {
          ...f,
          sizeMB,
          relativeUrl: null,
        };
      });
      next();
    });
  };
};
