import { randomUUID } from "node:crypto";
import path from "node:path";
import multer from "multer";
import fs from "fs-extra";
import { BaseError } from "../utils/base-error.util.js";
import { toSnakeCaseNonAccent } from "../utils/string.util.js";

const PRIVATE_UPLOAD_ROOT = path.join(
  process.cwd(),
  "src",
  "private",
  "uploads",
  "leader-meetings"
);

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_TYPES = new Set([
  ...IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const normalizeOriginalName = (name) =>
  Buffer.from(name, "latin1").toString("utf8");

const storage = multer.diskStorage({
  destination: async (req, _file, callback) => {
    try {
      if (!req.leaderMeetingUploadFolder) {
        const dateFolder = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(new Date());
        req.leaderMeetingUploadFolder = path.join(PRIVATE_UPLOAD_ROOT, dateFolder);
        await fs.ensureDir(req.leaderMeetingUploadFolder);
      }
      callback(null, req.leaderMeetingUploadFolder);
    } catch (error) {
      callback(error);
    }
  },
  filename: (_req, file, callback) => {
    const originalName = normalizeOriginalName(file.originalname);
    const extension = path.extname(originalName).toLowerCase();
    const baseName = toSnakeCaseNonAccent(path.basename(originalName, extension));
    callback(null, `${baseName || "file"}-${randomUUID()}${extension}`);
  },
});

const uploader = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    const allowed =
      file.fieldname === "supportingDocuments"
        ? DOCUMENT_TYPES.has(file.mimetype)
        : IMAGE_TYPES.has(file.mimetype);
    callback(allowed ? null : new BaseError(400, "File đính kèm không hợp lệ"), allowed);
  },
}).fields([
  { name: "citizenIdFront", maxCount: 1 },
  { name: "citizenIdBack", maxCount: 1 },
  { name: "supportingDocuments", maxCount: 3 },
]);

const getFiles = (req) => Object.values(req.files || {}).flat();

const cleanupFiles = async (files) => {
  await Promise.all(files.map((file) => fs.remove(file.path).catch(() => {})));
};

export const leaderMeetingRegistrationUpload = (req, res, next) => {
  uploader(req, res, async (error) => {
    if (error) {
      await cleanupFiles(getFiles(req));
      if (error instanceof multer.MulterError) {
        const message =
          error.code === "LIMIT_FILE_SIZE"
            ? "File vượt quá dung lượng cho phép (10MB)"
            : "Số lượng file đính kèm vượt quá giới hạn";
        return next(new BaseError(400, message));
      }
      return next(error);
    }

    const files = getFiles(req);
    const oversizedCitizenImage = files.find(
      (file) =>
        file.fieldname !== "supportingDocuments" &&
        file.size > 5 * 1024 * 1024
    );
    if (oversizedCitizenImage) {
      await cleanupFiles(files);
      return next(new BaseError(400, "Ảnh CCCD không được vượt quá 5MB"));
    }

    res.on("finish", () => {
      if (res.statusCode >= 400) cleanupFiles(files);
    });
    next();
  });
};
