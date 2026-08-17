import prisma from "../config/database.config.js";
import FileService from "../services/file.service.js";

const sanitizeAuditData = (value, sensitiveFields) => {
    if (!value || sensitiveFields.length === 0) return value;
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeAuditData(item, sensitiveFields));
    }
    if (typeof value !== "object") return value;

    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
            key,
            sensitiveFields.includes(key)
                ? "[REDACTED]"
                : sanitizeAuditData(item, sensitiveFields),
        ])
    );
};

const sanitizeResponseBody = (body, sensitiveFields) => {
    if (sensitiveFields.length === 0 || !body) return body;
    try {
        const parsed = typeof body === "string" ? JSON.parse(body) : body;
        const sanitized = sanitizeAuditData(parsed, sensitiveFields);
        return typeof body === "string" ? JSON.stringify(sanitized) : sanitized;
    } catch {
        return body;
    }
};

export const audit_logs = (action, entityName, options = {}) => {
    return async (req, res, next) => {
        const sensitiveFields = options.sensitiveFields || [];
        const requestAt = req.requestAt || new Date().toISOString();
        req.requestAt = requestAt;
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
                        duration_ms: new Date() - new Date(requestAt),
                        response_status_code: res.statusCode,
                        request_body: sanitizeAuditData(req.body || {}, sensitiveFields),
                        response_body: sanitizeResponseBody(responseBody || {}, sensitiveFields),
                        performed_by: userId,
                        response_sent_at: new Date().toISOString(),
                        request_received_at: requestAt,
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
