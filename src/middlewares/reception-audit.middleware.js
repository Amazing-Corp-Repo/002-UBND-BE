import prisma from "../config/database.config.js";

const sanitize = (value, sensitiveFields) => {
  if (!value || sensitiveFields.length === 0) return value;
  if (Array.isArray(value)) return value.map((item) => sanitize(item, sensitiveFields));
  if (typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveFields.includes(key) ? "[REDACTED]" : sanitize(item, sensitiveFields),
    ])
  );
};

const sanitizeBody = (body, sensitiveFields) => {
  if (!body || sensitiveFields.length === 0) return body;
  try {
    const parsed = typeof body === "string" ? JSON.parse(body) : body;
    const sanitized = sanitize(parsed, sensitiveFields);
    return typeof body === "string" ? JSON.stringify(sanitized) : sanitized;
  } catch {
    return body;
  }
};

export const receptionAudit = (action, options = {}) => (req, res, next) => {
  const requestAt = req.requestAt || new Date().toISOString();
  const sensitiveFields = options.sensitiveFields || [];
  const originalSend = res.send;

  res.send = function (body) {
    res.locals.responseBody = body;
    originalSend.call(this, body);
  };

  res.on("finish", async () => {
    try {
      await prisma.audit_logs.create({
        data: {
          action,
          username: req.payload?.username || null,
          remote_address: req.remoteAddress || req.ip,
          local_address: req.localAddress || req.socket?.localAddress,
          duration_ms: new Date() - new Date(requestAt),
          response_status_code: res.statusCode,
          request_body: sanitize(req.body || {}, sensitiveFields),
          response_body: sanitizeBody(res.locals.responseBody || {}, sensitiveFields),
          performed_by: req.payload?.userId || null,
          response_sent_at: new Date().toISOString(),
          request_received_at: requestAt,
          table_name: "dang_ky_tiep_dan",
        },
      });
    } catch (error) {
      console.error("Lỗi khi ghi audit log tiếp dân:", error);
    }
  });

  next();
};
