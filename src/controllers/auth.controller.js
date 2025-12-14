import AuthService from "../services/auth.service.js";
import { successResponse } from "../utils/response.util.js";

const AuthController = {
  async login(req, res) {
    const { tenDangNhap, matKhau } = req.body;
    const ip = req.clientIp;
    const device = req.device;
    const result = await AuthService.login(tenDangNhap, matKhau, ip, device);
    return successResponse(res, result, "Đăng nhập thành công");
  },

  async logout(req, res) {
    const { refreshToken } = req.body;
    const ip = req.clientIp;
    await AuthService.logout(refreshToken, ip);
    return successResponse(res, null, "Đăng xuất thành công");
  },

  async logoutForMobile(req, res) {
    const { refreshToken, fcmToken } = req.body;
    const ip = req.clientIp;
    await AuthService.logoutForMobile(refreshToken, fcmToken, ip);
    return successResponse(res, null, "Đăng xuất thành công");
  },

  async refreshToken(req, res) {
    const ip = req.clientIp;
    const device = req.device;
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken, ip, device);
    return successResponse(res, result, "Tạo mới accesstoken thành công");
  },

  async changePassword(req, res) {
    const userId = req.payload.userId;
    const { matKhauHienTai, matKhauMoi } = req.body;
    await AuthService.changePassword(userId, matKhauHienTai, matKhauMoi);
    return successResponse(res, null, "Đổi mật khẩu thành công");
  },

  async enableOrDisableTwoFactorAuth(req, res) {
    const userId = req.payload.userId;
    await AuthService.enableOrDisableTwoFactorAuth(userId);
    return successResponse(res, null, "Đã gửi OTP xác nhận bật/tắt 2FA");
  },

  async verifyTwoFactorAuth(req, res) {
    const ip = req.clientIp;
    const device = req.device;
    const { tenDangNhap, otp } = req.body;
    const result = await AuthService.verifyTwoFactorAuth(
      tenDangNhap,
      otp,
      ip,
      device
    );
    return successResponse(res, result, "Xác thực 2FA thành công");
  },

  async resetPassword(req, res) {
    const ip = req.clientIp;
    const device = req.device;
    const { email, newPassword, otp } = req.body;

    const result = await AuthService.resetPassword(
      email,
      newPassword,
      otp,
      ip,
      device
    );

    return successResponse(res, result, "Khôi phục mật khẩu thành công");
  },

  async sendOTP(req, res) {
    const { type } = req.query;
    const { email } = req.body;
    await AuthService.sendOTP(email, type);
    return successResponse(res, null, "Đã gửi OTP thành công");
  },

  async verifyEnableOrDisable2FA(req, res) {
    const userId = req.payload.userId;
    const { otp } = req.body;
    const result = await AuthService.verifyEnableOrDisable2FA(userId, otp);
    return successResponse(res, result, "Cập nhật trạng thái 2FA thành công");
  },

  async loginWithCaptcha(req, res) {
    const { tenDangNhap, matKhau, recaptchaToken } = req.body;
    const ip = req.clientIp;
    const device = req.device;
    const result = await AuthService.loginWithCaptcha(
      tenDangNhap,
      matKhau,
      recaptchaToken,
      ip,
      device
    );
    return successResponse(res, result, "Đăng nhập thành công");
  },
};

export default AuthController;
