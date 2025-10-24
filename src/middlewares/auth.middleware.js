import { BaseError } from "../utils/base-error.util.js";
import jwtUtils from "../utils/jwt.util.js";

// Middleware to authenticate user by verifying JWT token
export const authenticate = async (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        throw new BaseError(401, 'Acceess token không được cung cấp');
    }

    // Bearer tokenString
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
        // Verify token
        decoded = jwtUtils.verifyAccessToken(token);
    } catch (err) {
        throw new BaseError(401, 'Acceess token không hợp lệ');
    }
    // Attach user info to request
    req.payload = decoded;

    // ---- Lấy IP ----
    const xfwd = await req.headers["x-forwarded-for"];
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

    // Kiểm tra IP
    if (decoded.ip !== ip) {
        throw new BaseError(401, 'IP không khớp với IP khi đăng nhập');
    }

    global.prisma_user_id = decoded.userId;

    res.on("finish", () => {
        delete global.prisma_user_id;
    });
    
    next();

};


// Middleware to authorize user based on roles
export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (roles.length && !roles.includes(req.payload.role)) {
            throw new BaseError(403, 'Bạn không có quyền truy cập tài nguyên này');
        }
        next();
    }
};