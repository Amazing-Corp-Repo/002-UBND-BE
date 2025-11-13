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
    port: 465, // SSL port
    secure: true, // true cho port 465
    auth: {
        user: USER,
        pass: PASS, // App Password, không phải mật khẩu Gmail
    },
});

const MailService = {
    async renderTemplate(fileName, data) {
        try {
            if (!fileName) {
                throw new BaseError(500, "Tên file mẫu email không được để trống");
            }

            const layoutUrl = new URL("../templates/emails/layout.html", import.meta.url);
            const templateUrl = new URL(`../templates/emails/${fileName}`, import.meta.url);

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
                subject = "Khôi phục mật khẩu";
                templateFile = "reset-password.html";
                break;
            case MAIL_TYPE.ACCOUNT_CREATED:
                subject = "Tài khoản của bạn đã được tạo";
                templateFile = "account-created.html";
                break;
            case MAIL_TYPE.ENABLE_OR_DISABLE_2FA:
                subject = "Xác nhận bật/tắt xác thực hai yếu tố (2FA)";
                templateFile = "enable-or-disable-2fa.html";
                break;
            case MAIL_TYPE.LOGIN_2FA:
                subject = "Mã xác thực hai yếu tố (2FA) đăng nhập";
                templateFile = "login-2fa-otp.html";
                break;
            case MAIL_TYPE.UPDATE_PROFILE:
                subject = "Thông tin tài khoản của bạn đã được cập nhật";
                templateFile = "update-profile.html";
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

        return transporter.sendMail(mailOptions);
    },
};

export default MailService;
