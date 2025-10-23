import path from "path";
import UPLOAD_TYPE from "../constants/upload-type.constant.js";
import UserService from "./user.service.js";
import fs from "fs";
import { BaseError } from "../utils/base-error.util.js";

const FileService = {
    async uploadFile(req) {
        const relativeDir = path.relative(process.cwd(), req.file.destination);
        const url = path.join(relativeDir, req.file.filename).replace(/\\/g, "/");
        if (!req.file) {
            throw new BaseError(400, "No file uploaded");
        }

        switch (req.query.type) {
            case UPLOAD_TYPE.AVATAR:
                await UserService.uploadAvatar(req.payload.userId, url);
                break;
            default:
                throw new BaseError(400, "Invalid upload type");
        }

        return url;
    },

    async deleteFile(filePath) {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error("❌ Không xóa được file:", err.message);
            } else {
                console.log(`🗑️ File đã bị xóa: ${filePath}`);
            }
        });
    }
}

export default FileService;