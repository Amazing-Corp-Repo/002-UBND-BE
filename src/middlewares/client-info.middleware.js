import { UAParser } from "ua-parser-js";

export function clientInfo(req, res, next) {
    const xfwd = req.headers["x-forwarded-for"];
    const remoteIp =
        (xfwd && xfwd.split(",")[0].trim()) ||
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        "unknown";

    const localIp = req.socket.localAddress || "unknown";

    // Normalize IPv6 localhost (::1)
    const normalize = (ip) => (ip === "::1" || ip === "::ffff:127.0.0.1" ? "127.0.0.1" : ip);

    req.clientIp = normalize(remoteIp);   // RemoteHost
    req.serverIp = normalize(localIp);    // LocalAddress

    // Parse User-Agent
    const parser = new UAParser(req.headers["user-agent"]);
    const ua = parser.getResult();
    req.device = ua.browser?.name && ua.os?.name
        ? `${ua.browser.name}-${ua.os.name}`
        : ua.device?.model || "Unknown";

    next();
}