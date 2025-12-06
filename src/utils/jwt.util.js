import jwt from "jsonwebtoken";
import env from "../config/environment.config.js";

const jwtUtils = {
    signAccessToken(user, ip) {
        const payload = { userId: user.id, username: user.ten_dang_nhap, permissions: user.permissions, cate: user.cate, roles: user.roles, ip };
        return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN });
    },

    signRefreshToken(user, ip) {
        const payload = { userId: user.id, username: user.ten_dang_nhap, ip };
        return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN });
    },

    verifyAccessToken(token) {
        return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    },

    verifyRefreshToken(token) {
        return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
    },

    decode(token) {
        return jwt.decode(token);
    },
};

export default jwtUtils;