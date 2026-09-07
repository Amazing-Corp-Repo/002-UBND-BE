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
  fields,
  maxCount = 5,
  maxSizeMB = 10,
  allowed_types = [],
  basePathSegments = ["src", "public", "uploads"],
  isPublic = true,
} = {}) => {
  if (!type) {
    throw new BaseError(500, "Thiếu 'type' khi tạo uploader");
  }

  if (!fieldName && !fields) {
    throw new BaseError(500, "Thiếu 'fieldName' hoặc 'fields' khi tạo uploader");
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
    // Kiểm tra allowed_types theo fieldName
    let allowList = allowed_types;
    if (fields && fields.length > 0) {
      const fieldCfg = fields.find((f) => f.fieldName === file.fieldname);
      if (fieldCfg && fieldCfg.allowed_types && fieldCfg.allowed_types.length > 0) {
        allowList = fieldCfg.allowed_types;
      }
    }
    if (allowList.length > 0 && !allowList.includes(file.mimetype)) {
      return cb(new BaseError(400, `File không hợp lệ`));
    }
    cb(null, true);
  };

  // Tính maxSize từ tất cả field
  let globalMaxSizeMB = maxSizeMB;
  if (fields && fields.length > 0) {
    globalMaxSizeMB = Math.max(...fields.map((f) => f.maxSizeMB || maxSizeMB));
  }

  const limits = { fileSize: globalMaxSizeMB * 1024 * 1024 };

  // Tạo multer instance: dùng .fields() nếu có multi-field, .array() nếu single
  let uploader;
  if (fields && fields.length > 0) {
    uploader = multer({ storage, fileFilter, limits }).fields(
      fields.map((f) => ({
        name: f.fieldName,
        maxCount: f.maxCount || 5,
      }))
    );
  } else {
    uploader = multer({ storage, fileFilter, limits }).array(
      fieldName,
      maxCount,
    );
  }

  const processFile = (f) => {
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
    return {
      ...f,
      sizeMB,
      relativeUrl: null,
    };
  };

  return (req, res, next) => {
    uploader(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        await cleanupUploadFolder(req);
        switch (err.code) {
          case "LIMIT_FILE_SIZE":
            return next(
              new BaseError(
                400,
                `File vượt quá dung lượng cho phép (${globalMaxSizeMB}MB)`,
              ),
            );
          case "LIMIT_FILE_COUNT":
          case "LIMIT_UNEXPECTED_FILE":
            return next(
              new BaseError(400, `Chỉ được upload tối đa số lượng cho phép`),
            );
          default:
            return next(new BaseError(400, err.message));
        }
      } else if (err) {
        await cleanupUploadFolder(req);
        return next(err);
      }

      // Xử lý post-processing: map files để thêm relativeUrl, sizeMB
      if (req.files) {
        if (Array.isArray(req.files)) {
          // .array() mode: req.files là array
          req.files = req.files.map(processFile);
        } else {
          // .fields() mode: req.files là object { fieldName: [file, ...] }
          const processed = {};
          for (const [key, fileList] of Object.entries(req.files)) {
            processed[key] = fileList.map(processFile);
          }
          req.files = processed;
        }
      }

      next();
    });
  };
};
