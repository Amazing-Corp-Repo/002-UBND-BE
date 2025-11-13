import prisma from "../config/database.config.js";
import FileService from "../services/file.service.js";

export const audit_logs = (action, entityName) => {
    return async (req, res, next) => {
        const userId = req.payload?.userId || null;
        const username = req.payload?.username || null;

        const originalSend = res.send;

        res.send = function (body) {
            // Lưu response body vào res.locals
            res.locals.responseBody = body;

            // Gọi phương thức send gốc để gửi phản hồi về client
            originalSend.call(this, body);
        };

        res.on("finish", async () => {

            const responseBody = res.locals.responseBody;
            try {
                let { success } = JSON.parse(responseBody) || {};
                if (success === false) {
                    try {
                        for (const f of req.files || []) {
                            if (f?.path) {
                                try {
                                    await FileService.deleteFileByAbsolutePath(f.path);
                                } catch (e) {
                                    console.error('Failed to delete uploaded file', f?.path, e);
                                }
                            }
                        }
                    } catch (err) {
                        console.error('Error while cleaning uploaded files after failed response:', err);
                    }
                }
            } catch (error) {
            }

            try {
                await prisma.audit_logs.create({
                    data: {
                        action,
                        username: username,
                        remote_address: req.remoteAddress,
                        local_address: req.localAddress,
                        duration_ms: new Date() - new Date(req.requestAt),
                        response_status_code: res.statusCode,
                        request_body: req.body || {},
                        response_body: responseBody || {},
                        performed_by: userId,
                        response_sent_at: new Date().toISOString(),
                        request_received_at: req.requestAt,
                        table_name: entityName,
                    }
                })
            } catch (error) {
                console.error("Lỗi khi ghi audit log:", error);
            }
        });
        next();
    }
};