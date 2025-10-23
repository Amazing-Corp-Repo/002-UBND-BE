import { UAParser } from "ua-parser-js";

export function clientInfo(req, res, next) {
    // ---- Lấy IP ----
    const xfwd = req.headers["x-forwarded-for"];
    let ip =
        (xfwd && xfwd.split(",")[0].trim()) ||
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        "unknown";

    // Normalize IPv6 localhost (::1) về IPv4 127.0.0.1
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
        ip = "127.0.0.1";
    }

    // ---- Lấy device từ User-Agent ----
    const parser = new UAParser(req.headers["user-agent"]);
    const result = parser.getResult();

    let deviceString = "Unknown";
    if (result.browser?.name && result.os?.name) {
        deviceString = `${result.browser.name}-${result.os.name}`;
    } else if (result.device?.model) {
        deviceString = `${result.device.vendor || ""} ${result.device.model}`.trim();
    }

    // Gắn vào request
    req.clientIp = ip;
    req.device = deviceString;

    next();
}
