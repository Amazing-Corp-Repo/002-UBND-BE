import jwt from "jsonwebtoken";
import env from "../config/environment.config.js";

const jwtUtils = {
    //Generate access token
    signAccessToken(user, ip) {
        console.log(user)
        const payload = { userId: user.id, username: user.ten_dang_nhap, role: user.vai_tro, ip };
        return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN });
    },

    //Generate refresh token
    signRefreshToken(user, ip) {
        const payload = { userId: user.id, username: user.ten_dang_nhap, role: user.vai_tro, ip };
        return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN });
    },

    //Verify access token
    verifyAccessToken(token) {
        return jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    },

    //Verify refresh token
    verifyRefreshToken(token) {
        return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
    },

    decode(token) {
        return jwt.decode(token);
    },
};

export default jwtUtils;