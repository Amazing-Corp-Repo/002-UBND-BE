const SENSITIVE_FIELD = /(?:mat[_-]?khau|password|passphrase|secret|token|authorization|api[_-]?key|otp|pin)/i;

const isSensitiveField = (key) => SENSITIVE_FIELD.test(String(key));

export const sanitizeAuditPayload = (value, seen = new WeakSet()) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditPayload(item, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        isSensitiveField(key) ? "[REDACTED]" : sanitizeAuditPayload(item, seen),
      ]),
    );
  }

  return value;
};

export const sanitizeAuditResponseBody = (responseBody) => {
  if (typeof responseBody === "string") {
    try {
      return JSON.stringify(sanitizeAuditPayload(JSON.parse(responseBody)));
    } catch {
      return JSON.stringify(sanitizeAuditPayload(responseBody));
    }
  }

  return JSON.stringify(sanitizeAuditPayload(responseBody ?? {}));
};
