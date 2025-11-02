import { BaseError } from "../utils/base-error.util.js";
import UserRepository from "../repositories/user.repository.js";
import jwtUtils from "../utils/jwt.util.js";
import RefreshTokenService from "./refresh-token.service.js";
import { compare, hash } from "../utils/bcrypt.util.js";
import OTP_TYPE from "../constants/otp.constants.js";
import OTPService from "./otp.service.js";
import UserSessionLogRepository from "../repositories/user-session-log.repository.js";

const AuthService = {
    async login(tenDangNhap, matKhau, ip, device) {
        const user = await UserRepository.findUserByUsername(tenDangNhap);
        if (!user) {
            throw new BaseError(404, "Không tìm thấy người dùng");
        }
        if (!user.is_active) {
            throw new BaseError(403, "Tài khoản người dùng không hoạt động");
        }

        if (!await compare(matKhau, user.mat_khau)) {
            throw new BaseError(401, "Mật khẩu không đúng");
        }

        if (user.is_enable_two_factor) {
            await OTPService.sendOTP(user.id, user.email, OTP_TYPE.LOGIN_2FA);
            return { requiresTwoFactorAuth: true };
        }

        await RefreshTokenService.revokeAllForUser(user.id, ip);

        await UserSessionLogRepository.endSession(user.id);
        await UserSessionLogRepository.createLog({
            id_nguoi_dung: user.id,
            ip: ip,
            device: device
        });

        const accessToken = jwtUtils.signAccessToken(user, ip);
        const refreshToken = await RefreshTokenService.generate(user, ip, device);
        return {
            access_token: accessToken,
            refresh_token: refreshToken
        };
    },

    async refreshToken(refreshToken, ip, device) {
        const decoded = await RefreshTokenService.verify(refreshToken, ip);

        const user = await UserRepository.findById(decoded.userId);
        if (!user) {
            throw new BaseError(404, "Không tìm thấy người dùng");
        }
        if (!user.trang_thai) {
            throw new BaseError(403, "Tài khoản người dùng không hoạt động");
        }

        // Phát hành token mới
        const accessToken = jwtUtils.signAccessToken(user, ip);
        const newRefreshToken = await RefreshTokenService.rotate(refreshToken, user, ip, device);
        return {
            accessToken,
            refreshToken: newRefreshToken
        };

    },

    async logout(refreshToken, ip) {
        await RefreshTokenService.revoke(refreshToken, ip);
    },

    async changePassword(userId, mat_khau_hien_tai, mat_khau_moi) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BaseError(404, "Không tìm thấy người dùng");
        }
        if (!user.trang_thai) {
            throw new BaseError(403, "Tài khoản người dùng không hoạt động");
        }
        if (!await compare(mat_khau_hien_tai, user.mat_khau)) {
            throw new BaseError(401, "Mật khẩu hiện tại không đúng");
        }
        const hashedPassword = await hash(mat_khau_moi);

        return await UserRepository.updateUser(userId, { mat_khau: hashedPassword });
    },

    async enableOrDisableTwoFactorAuth(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BaseError(404, "Không tìm thấy người dùng");
        }
        if (!user.trang_thai) {
            throw new BaseError(403, "Tài khoản người dùng không hoạt động");
        }

        const loai_otp = user.is_enable_two_factor ? OTP_TYPE.DISABLE_2FA : OTP_TYPE.ENABLE_2FA;

        await OTPService.sendOTP(userId, user.email, loai_otp);
    },

    async verifyTwoFactorAuth(tenDangNhap, otp, ip, device) {
        const user = await UserRepository.findByUsername(tenDangNhap);
        if (!user) {
            throw new BaseError(404, "Không tìm thấy người dùng");
        }
        if (!user.trang_thai) {
            throw new BaseError(403, "Tài khoản người dùng không hoạt động");
        }

        const isValid = await OTPService.verifyOTP(user.id, otp, OTP_TYPE.LOGIN_2FA);
        if (!isValid) {
            throw new BaseError(400, "OTP không hợp lệ hoặc đã hết hạn");
        }

        await RefreshTokenService.revokeAllForUser(user.id, ip);

        const accessToken = jwtUtils.signAccessToken(user, ip);
        const refreshToken = await RefreshTokenService.generate(user, ip, device);
        return {
            accessToken,
            refreshToken
        };
    },

    async resetPassword(email, newPassword, otp, ip, device) {
        const user = await UserRepository.findByEmail(email);

        if (!user) {
            throw new BaseError(404, "Không tìm thấy người dùng");
        }
        if (!user.trang_thai) {
            throw new BaseError(403, "Tài khoản người dùng không hoạt động");
        }

        const isValid = await OTPService.verifyOTP(user.id, otp, OTP_TYPE.RESET_PASSWORD);
        if (!isValid) {
            throw new BaseError(400, "OTP không hợp lệ hoặc đã hết hạn");
        }
        const hashedPassword = await hash(newPassword);


        await UserRepository.updateUser(user.id, { mat_khau: hashedPassword });

        await RefreshTokenService.revokeAllForUser(user.id, ip);

        const accessToken = jwtUtils.signAccessToken(user, ip);
        const refreshToken = await RefreshTokenService.generate(user, ip, device);
        return {
            accessToken,
            refreshToken
        };
    },

    async sendOTP(email, type) {
        const user = await UserRepository.findByEmail(email);

        if (!user) {
            throw new BaseError(404, "Không tìm thấy người dùng");
        }
        if (!user.trang_thai) {
            throw new BaseError(403, "Tài khoản người dùng không hoạt động");
        }

        await OTPService.sendOTP(user.id, email, type);
    },

    async verifyEnableOrDisable2FA(userId, otp) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BaseError(404, "Không tìm thấy người dùng");
        }
        if (!user.trang_thai) {
            throw new BaseError(403, "Tài khoản người dùng không hoạt động");
        }

        const loai_otp = user.is_enable_two_factor ? OTP_TYPE.DISABLE_2FA : OTP_TYPE.ENABLE_2FA;
        const isValid = await OTPService.verifyOTP(user.id, otp, loai_otp);

        if (!isValid) {
            throw new BaseError(400, "OTP không hợp lệ hoặc đã hết hạn");
        }

        const newStatus = !user.is_enable_two_factor;


        await UserRepository.updateUser(userId, { is_enable_two_factor: newStatus });

        return { is_enable_two_factor: newStatus };
    }
};

export default AuthService;