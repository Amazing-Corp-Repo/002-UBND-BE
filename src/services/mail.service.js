import nodemailer from "nodemailer";
import fs from "fs-extra";
import handlebars from "handlebars";
import env from "../config/environment.config.js";
import MAIL_TYPE from "../constants/mail.constant.js";
import { BaseError } from "../utils/base-error.util.js";

const USER = env.MAIL_USER;
const PASS = env.MAIL_PASS;
const APP_NAME = env.APP_NAME;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // ✅ ĐÚNG
  secure: false, // ✅ STARTTLS
  auth: {
    user: USER,
    pass: PASS, // App Password (16 ký tự)
  },
  tls: {
    rejectUnauthorized: false, // optional – tránh lỗi cert ở VPS
  },
});

const MailService = {
  async renderTemplate(fileName, data) {
    try {
      if (!fileName) {
        throw new BaseError(500, "Tên file mẫu email không được để trống");
      }

      const layoutUrl = new URL(
        "../templates/emails/layout.html",
        import.meta.url
      );
      const templateUrl = new URL(
        `../templates/emails/${fileName}`,
        import.meta.url
      );

      const [layoutHTML, bodyHTML] = await Promise.all([
        fs.readFile(layoutUrl, "utf8"),
        fs.readFile(templateUrl, "utf8"),
      ]);

      const layout = handlebars.compile(layoutHTML);
      const body = handlebars.compile(bodyHTML)(data);

      return layout({
        body,
        ...data,
        year: new Date().getFullYear(),
        appName: APP_NAME,
      });
    } catch (error) {
      throw new BaseError(500, "Lỗi khi kết xuất mẫu email");
    }
  },

  async sendMail(to, type, data = {}) {
    let subject = "Thông báo";
    let templateFile = "";

    switch (type) {
      case MAIL_TYPE.RESET_PASSWORD:
        subject = `[${APP_NAME}] Đặt lại mật khẩu`;
        templateFile = "reset-password.html";
        break;
      case MAIL_TYPE.ACCOUNT_CREATED:
        subject = `[${APP_NAME}] Tài khoản của bạn đã được tạo`;
        templateFile = "account-created.html";
        break;
      case MAIL_TYPE.ENABLE_OR_DISABLE_2FA:
        subject = `[${APP_NAME}] Thay đổi trạng thái xác thực hai yếu tố (2FA)`;
        templateFile = "enable-or-disable-2fa.html";
        break;
      case MAIL_TYPE.LOGIN_2FA:
        subject = `[${APP_NAME}] Mã xác thực hai yếu tố (2FA)`;
        templateFile = "login-2fa-otp.html";
        break;
      case MAIL_TYPE.UPDATE_PROFILE:
        subject = `[${APP_NAME}] Cập nhật thông tin cá nhân`;
        templateFile = "update-profile.html";
        break;
      case MAIL_TYPE.PHAN_ANH_STATUS_UPDATED:
        subject = `[${APP_NAME}] Phản ánh đã được cập nhật trạng thái #${data.maPhanAnh}`;
        templateFile = "report-status-updated.html";
        break;
      case MAIL_TYPE.EXPORT_READY:
        subject = `[${APP_NAME}] File export đã sẵn sàng`;
        templateFile = "export-ready.html";
        break;
      default:
        throw new BaseError(400, "Loại email không hợp lệ");
    }

    const html = await this.renderTemplate(templateFile, data);

    const mailOptions = {
      from: `"${APP_NAME}" <${USER}>`,
      to,
      subject,
      html,
    };
    try {
      transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Lỗi gửi email:", error);
      return null;
    }
  },

  async sendMailCC({ to, cc = [], bcc = [], type, data = {} }) {
    if (!to && cc.length === 0 && bcc.length === 0) {
      throw new BaseError(400, "Phải có ít nhất một người nhận email");
    }

    let subject = "Thông báo";
    let templateFile = "";

    switch (type) {
      case MAIL_TYPE.CREATE_PHAN_ANH:
        subject = `[${APP_NAME}] Có phản ánh mới cần xử lý #${data.maPhanAnh}`;
        templateFile = "new-report-created.html";
        break;
      case MAIL_TYPE.PHAN_ANH_STATUS_UPDATED:
        subject = `[${APP_NAME}] Phản ánh đã được cập nhật trạng thái #${data.maPhanAnh}`;
        templateFile = "report-status-updated.html";
        break;
      default:
        throw new BaseError(400, "Loại email không hợp lệ cho sendMailCC");
    }

    const html = await this.renderTemplate(templateFile, data);
    const mailOptions = {
      from: `"${APP_NAME}" <${USER}>`,
      bcc,
      subject,
      html,
    };
    try {
      transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Lỗi gửi email với CC/BCC:", error);
      return null;
    }
  },
};

export default MailService;
