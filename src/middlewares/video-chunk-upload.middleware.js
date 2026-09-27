import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";
import fs from "fs-extra";
import { BaseError } from "../utils/base-error.util.js";
import { cleanOriginalFileName, toSnakeCaseNonAccent } from "../utils/string.util.js";

const VIDEO_CHUNK_ROOT = path.join(
  process.cwd(),
  "src",
  "private",
  "uploads",
  "videos",
  "PHAN_ANH",
);
const VIDEO_TYPES = new Set(["video/mp4", "video/mov", "video/avi", "video/mkv"]);

const cleanupFiles = async (files = []) => {
  await Promise.all(files.map((file) => fs.remove(file.path).catch(() => {})));
};

const storage = multer.diskStorage({
  destination: async (req, _file, callback) => {
    try {
      if (!req.videoChunkUploadFolder) {
        const dateFolder = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(new Date());
        req.videoChunkUploadFolder = path.join(VIDEO_CHUNK_ROOT, dateFolder);
        await fs.ensureDir(req.videoChunkUploadFolder);
      }
      callback(null, req.videoChunkUploadFolder);
    } catch (error) {
      callback(error);
    }
  },
  filename: (_req, file, callback) => {
    const originalName = cleanOriginalFileName(file.originalname);
    const extension = path.extname(originalName).toLowerCase();
    const baseName = toSnakeCaseNonAccent(path.basename(originalName, extension));
    callback(null, `${baseName || "chunk"}-${randomUUID()}${extension}`);
  },
});

const uploader = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = VIDEO_TYPES.has(file.mimetype);
    callback(allowed ? null : new BaseError(400, "File không hợp lệ"), allowed);
  },
}).array("file", 1);

export const videoChunkUpload = (req, res, next) => {
  uploader(req, res, async (error) => {
    if (error) {
      await cleanupFiles(req.files || []);
      if (error instanceof multer.MulterError) {
        const message =
          error.code === "LIMIT_FILE_SIZE"
            ? "Video không được vượt quá 300 MB"
            : "Mỗi lần chỉ được upload một phần video";
        return next(new BaseError(400, message));
      }
      return next(error);
    }

    const files = req.files || [];
    for (const file of files) {
      file.sizeMB = +(file.size / (1024 * 1024)).toFixed(2);
    }

    res.on("finish", () => {
      if (res.statusCode >= 400) void cleanupFiles(files);
    });
    return next();
  });
};
