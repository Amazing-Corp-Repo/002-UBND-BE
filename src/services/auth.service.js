import { BaseError } from "../utils/base-error.util.js";
import UserRepository from "../repositories/user.repository.js";
import jwtUtils from "../utils/jwt.util.js";
import RefreshTokenService from "./refresh-token.service.js";
import { compare, hash } from "../utils/bcrypt.util.js";
import OTP_TYPE from "../constants/otp.constants.js";
import OTPService from "./otp.service.js";
import UserSessionLogRepository from "../repositories/user-session-log.repository.js";
import CaptchaRepository from "../repositories/http/captcha.repository.js";
import PermissionRepository from "../repositories/permission.repository.js";
import LinhVucPhanAnhRepository from "../repositories/linh-vuc-phan-anh.repository.js";
import RoleRepository from "../repositories/role.repository.js";

const AuthService = {
  async login(tenDangNhap, matKhau, ip, device) {
    const user = await UserRepository.findUserByUsername(tenDangNhap);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    if (!user.is_active) {
      throw new BaseError(403, "Tài khoản người dùng không hoạt động");
    }

    if (!(await compare(matKhau, user.mat_khau))) {
      throw new BaseError(401, "Mật khẩu không đúng");
    }

    if (user.is_enable_two_factor) {
      await OTPService.sendOTP(user.id, user.email, OTP_TYPE.LOGIN_2FA);
      return { requires_two_factor_auth: true };
    }

    await RefreshTokenService.revokeAllForUser(user.id, ip);

    await UserSessionLogRepository.endSession(user.id);
    await UserSessionLogRepository.createLog({
      id_nguoi_dung: user.id,
      ip: ip,
      device: device,
    });
    user.permissions = await buildUserPermission(user.id);
    user.cate = await buildCateReflections(user.id);
    user.roles = await buildRoleName(user.id);
    const accessToken = jwtUtils.signAccessToken(user, ip);
    const refreshToken = await RefreshTokenService.generate(user, ip, device);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  },

  async refreshToken(refreshToken, ip, device) {
    const decoded = await RefreshTokenService.verify(refreshToken, ip);

    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    if (!user.is_active) {
      throw new BaseError(403, "Tài khoản người dùng không hoạt động");
    }

    // Phát hành token mới
    user.permissions = await buildUserPermission(user.id);
    user.cate = await buildCateReflections(user.id);
    user.roles = await buildRoleName(user.id);
    const accessToken = jwtUtils.signAccessToken(user, ip);
    const newRefreshToken = await RefreshTokenService.rotate(
      refreshToken,
      user,
      ip,
      device
    );
    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  },

  async logout(refreshToken, ip) {
    await RefreshTokenService.revoke(refreshToken, ip);
  },

  async logoutForMobile(refreshToken, ip) {
    let decoded = await RefreshTokenService.verify(refreshToken, ip);
    let user = await UserRepository.findById(decoded.userId);
    if (user && user.fcm_token) {
      await UserRepository.updateUser(user.id, { fcm_token: null });
    }
  },

  async changePassword(userId, mat_khau_hien_tai, mat_khau_moi) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    if (!user.is_active) {
      throw new BaseError(403, "Tài khoản người dùng không hoạt động");
    }
    if (!(await compare(mat_khau_hien_tai, user.mat_khau))) {
      throw new BaseError(401, "Mật khẩu hiện tại không đúng");
    }
    const hashedPassword = await hash(mat_khau_moi);

    return await UserRepository.updateUser(userId, {
      mat_khau: hashedPassword,
    });
  },

  async enableOrDisableTwoFactorAuth(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    if (!user.is_active) {
      throw new BaseError(403, "Tài khoản người dùng không hoạt động");
    }

    const loai_otp = user.is_enable_two_factor
      ? OTP_TYPE.DISABLE_2FA
      : OTP_TYPE.ENABLE_2FA;

    await OTPService.sendOTP(userId, user.email, loai_otp);
  },

  async verifyTwoFactorAuth(tenDangNhap, otp, ip, device) {
    const user = await UserRepository.findByUsername(tenDangNhap);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    if (!user.is_active) {
      throw new BaseError(403, "Tài khoản người dùng không hoạt động");
    }

    const isValid = await OTPService.verifyOTP(
      user.id,
      otp,
      OTP_TYPE.LOGIN_2FA
    );
    if (!isValid) {
      throw new BaseError(400, "OTP không hợp lệ hoặc đã hết hạn");
    }

    await RefreshTokenService.revokeAllForUser(user.id, ip);
    user.permissions = await buildUserPermission(user.id);
    const accessToken = jwtUtils.signAccessToken(user, ip);
    const refreshToken = await RefreshTokenService.generate(user, ip, device);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  },

  async resetPassword(email, newPassword, otp, ip, device) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    if (!user.is_active) {
      throw new BaseError(403, "Tài khoản người dùng không hoạt động");
    }

    const isValid = await OTPService.verifyOTP(
      user.id,
      otp,
      OTP_TYPE.RESET_PASSWORD
    );
    if (!isValid) {
      throw new BaseError(400, "OTP không hợp lệ hoặc đã hết hạn");
    }
    const hashedPassword = await hash(newPassword);

    await UserRepository.updateUser(user.id, { mat_khau: hashedPassword });

    await RefreshTokenService.revokeAllForUser(user.id, ip);
    user.permissions = await buildUserPermission(user.id);
    const accessToken = jwtUtils.signAccessToken(user, ip);
    const refreshToken = await RefreshTokenService.generate(user, ip, device);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  },

  async sendOTP(email, type) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    if (!user.is_active) {
      throw new BaseError(403, "Tài khoản người dùng không hoạt động");
    }

    await OTPService.sendOTP(user.id, email, type);
  },

  async verifyEnableOrDisable2FA(userId, otp) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    if (!user.is_active) {
      throw new BaseError(403, "Tài khoản người dùng không hoạt động");
    }

    const loai_otp = user.is_enable_two_factor
      ? OTP_TYPE.DISABLE_2FA
      : OTP_TYPE.ENABLE_2FA;
    const isValid = await OTPService.verifyOTP(user.id, otp, loai_otp);

    if (!isValid) {
      throw new BaseError(400, "OTP không hợp lệ hoặc đã hết hạn");
    }

    const newStatus = !user.is_enable_two_factor;

    await UserRepository.updateUser(userId, {
      is_enable_two_factor: newStatus,
    });

    return { is_enable_two_factor: newStatus };
  },

  async loginWithCaptcha(tenDangNhap, matKhau, recaptchaToken, ip, device) {
    
    const data = await CaptchaRepository.verify(recaptchaToken, ip);

    if (!data.success) {
      throw new BaseError(400, "Xác thực reCAPTCHA không thành công");
    }

    return this.login(tenDangNhap, matKhau, ip, device);
  },
};

const buildUserPermission = async (userId) => {
  return await PermissionRepository.getPermissionsByUserId(userId);
};

const buildCateReflections = async (userId) => {
  let cate = await LinhVucPhanAnhRepository.getLinhVucIdByUserId(userId);
  let result = cate.join(", ");
  return result;
};

const buildRoleName = async (userId) => {
  const userRoles = await RoleRepository.getRoleByUserId(userId);
  let result = userRoles.map((ur) => ur.roles.name);
  return result.join(", ");
};

export default AuthService;