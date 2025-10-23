import jwtUtils from "../utils/jwt.util.js";
import { sha256 } from "../utils/crypto.util.js";
import RefreshTokenRepository from "../repositories/refresh-token.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import env from "../config/environment.config.js";
import ms from "ms";
import UserSessionLogRepository from "../repositories/user-session-log.repository.js";

const REFRESH_TOKEN_EXPIRES_IN = env.REFRESH_TOKEN_EXPIRES_IN

const RefreshTokenService = {
    async generate(user, created_by_ip, device) {
        // Sinh JWT refresh token
        const refreshToken = jwtUtils.signRefreshToken(user, created_by_ip);

        // Lưu hash của token vào DB
        const token_hash = sha256(refreshToken);

        // Lưu vào DB

        await RefreshTokenRepository.create({
            nguoi_dung_id: user.id,
            token_hash,
            expires_at: new Date(Date.now() + ms(REFRESH_TOKEN_EXPIRES_IN)).toISOString(),
            created_by_ip,
            device,
        })

        // trả JWT plaintext cho FE
        return refreshToken;
    },

    async verify(refreshToken, currentIp) {
        let decoded;
        try {
            decoded = jwtUtils.verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new BaseError(401, "Refresh token không hợp lệ");
        }
        const tokenHash = sha256(refreshToken);

        const stored = await RefreshTokenRepository.findByHash(tokenHash);

        if (!stored) {
            throw new BaseError(401, "Refresh token không hợp lệ");
        }

        if (decoded.ip && decoded.ip !== currentIp) {
            throw new BaseError(401, "Địa chỉ IP không khớp với token ban đầu");
        }

        return decoded;
    },

    async rotate(oldRefreshToken, user, createdByIp, device) {
        const oldHash = sha256(oldRefreshToken);
        const oldTokenDoc = await RefreshTokenRepository.findByHash(oldHash);

        if (!oldTokenDoc) {
            throw new BaseError(401, "Refresh token không hợp lệ");
        }

        const newRefreshToken = jwtUtils.signRefreshToken(user, createdByIp);

        // Lưu hash của token mới vào DB
        const decodedNew = jwtUtils.verifyRefreshToken(newRefreshToken);
        const newHash = sha256(newRefreshToken);

        // Revoke token cũ
        oldTokenDoc.replaced_by_token_hash = newHash;
        oldTokenDoc.is_revoked = true;
        oldTokenDoc.revoked_by_ip = createdByIp;
        await RefreshTokenRepository.update(oldTokenDoc.id, oldTokenDoc);

        // Lưu token mới
        await RefreshTokenRepository.create({
            nguoi_dung_id: user.id,
            token_hash: newHash,
            expires_at: new Date(Date.now() + ms(REFRESH_TOKEN_EXPIRES_IN)).toISOString(),
            created_by_ip: createdByIp,
            device,
        });

        // Trả về token mới
        return newRefreshToken;
    },

    async revoke(refreshToken, ip) {
        // Tìm token trong DB và đánh dấu thu hồi
        const tokenHash = sha256(refreshToken);
        const tokenDoc = await RefreshTokenRepository.findByHash(tokenHash);

        await UserSessionLogRepository.endSession(tokenDoc.nguoi_dung_id);

        // Nếu tìm thấy và chưa bị thu hồi, thì thu hồi
        if (tokenDoc) {
            tokenDoc.revoked_by_ip = ip;
            tokenDoc.is_revoked = true;
            await RefreshTokenRepository.update(tokenDoc.id, tokenDoc);
        }
    },

    async revokeAllForUser(userId, ip) {
        await RefreshTokenRepository.revokeAllForUser(userId, ip);
    }
};

export default RefreshTokenService;