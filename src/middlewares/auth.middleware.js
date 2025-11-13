import { BaseError } from "../utils/base-error.util.js";
import jwtUtils from "../utils/jwt.util.js";
import env from "../config/environment.config.js";

export const authenticate = async (req, res, next) => {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new BaseError(401, 'Acceess token không được cung cấp');
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
        decoded = jwtUtils.verifyAccessToken(token);
    } catch (err) {
        throw new BaseError(401, 'Acceess token không hợp lệ');
    }

    // ---- Lấy IP ----
    const xfwd = await req.headers["x-forwarded-for"];
    let ip =
        (xfwd && xfwd.split(",")[0].trim()) ||
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        "unknown";
    let localAddress = req.socket.localAddress

    const normalize = (ip) => (ip === "::1" || ip === "::ffff:127.0.0.1" ? "127.0.0.1" : ip);

    ip = normalize(ip);
    localAddress = normalize(localAddress);

    // Kiểm tra IP
    if (decoded.ip !== ip) {
        throw new BaseError(401, 'IP không khớp với IP khi đăng nhập');
    }
    req.payload = decoded;
    req.remoteAddress = ip;
    req.localAddress = localAddress;
    req.requestAt = new Date().toISOString();

    next();
};

export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (roles.length && !roles.includes(req.payload.role)) {
            throw new BaseError(403, 'Bạn không có quyền truy cập tài nguyên này');
        }
        next();
    }
};

export const logAuthMiddleware = (req, res, next) => {
    const { username, password } = req.query;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Vui lòng truyền username và password."
        });
    }

    if (
        username !== env.SWAGGER_USERNAME ||
        password !== env.SWAGGER_PASSWORD
    ) {
        return res.status(401).json({
            success: false,
            message: "Sai username hoặc password."
        });
    }

    next();
};