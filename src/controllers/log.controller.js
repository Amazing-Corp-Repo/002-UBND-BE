import LogService from "../services/log.service.js";
import { BaseError } from "../utils/base-error.util.js";
import { errorResponse, successResponse } from "../utils/response.util.js";
import fs from "fs";
import path from "path";

const logDir = path.resolve("src/logs");
const LogController = {
    async getLogList(req, res) {
        const result = await LogService.getLogList();
        return successResponse(res, result, "Lấy danh sách log thành công");
    },

    async getLogFile(req, res) {
        const { fileName } = req.params;

        const safeName = path.basename(fileName);
        const fullPath = path.join(logDir, safeName);

        if (!fs.existsSync(fullPath)) {
            throw new BaseError(404, "File log không tồn tại");
        }

        res.setHeader("Content-Type", "text/plain; charset=utf-8");

        const stream = fs.createReadStream(fullPath);

        stream.on("error", (err) => {
            console.error("Stream error:", err);
            throw new BaseError(500, "Lỗi khi đọc file log");
        });

        return stream.pipe(res);
    },

    async downloadLogFile(req, res) {
        const { fileName } = req.params;

        const safeName = path.basename(fileName);

        const fullPath = path.join(logDir, safeName);

        if (!fs.existsSync(fullPath)) {
            throw new BaseError(404, "File log không tồn tại");
        }

        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);

        const stream = fs.createReadStream(fullPath);

        stream.on("error", (err) => {
            console.error("Download error:", err);
            throw new BaseError(500, "Lỗi khi tải file log");
        });

        return stream.pipe(res);
    }

};

export default LogController;