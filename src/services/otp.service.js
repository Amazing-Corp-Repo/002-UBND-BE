import env from "../config/environment.config.js";
import MAIL_TYPE from "../constants/mail.constant.js";
import OTP_TYPE from "../constants/otp.constants.js";
import OTPRepository from "../repositories/otp.repositpory.js";
import { BaseError } from "../utils/base-error.util.js";
import { generateRandomNumber } from "../utils/random-number.util.js";
import MailService from "./mail.service.js";

const OTP_EXPIRE_MINUTES = parseInt(env.OTP_EXPIRE_MINUTES);

const OTPService = {
    async sendOTP(userId, email, otpType) {
        const otpCode = generateRandomNumber(6);
        const expires_at = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000).toISOString();

        await OTPRepository.create({
            nguoi_dung_id: userId,
            ma_otp: otpCode,
            loai_otp: otpType,
            expires_at,
            sent_to_email: email,
        });

        switch (otpType) {
            case OTP_TYPE.ENABLE_2FA:
            case OTP_TYPE.DISABLE_2FA:
                await MailService.sendMail(
                    email,
                    MAIL_TYPE.ENABLE_OR_DISABLE_2FA,
                    {
                        otp: otpCode,
                        otpExpiresInMinutes: OTP_EXPIRE_MINUTES,
                        isEnabled: otpType === OTP_TYPE.ENABLE_2FA,
                    },
                );
                break;
            case OTP_TYPE.RESET_PASSWORD:
                await MailService.sendMail(
                    email,
                    MAIL_TYPE.RESET_PASSWORD,
                    {
                        otp: otpCode,
                        otpExpiresInMinutes: OTP_EXPIRE_MINUTES,
                    },
                );
                break;
            case OTP_TYPE.LOGIN_2FA:
                await MailService.sendMail(
                    email,
                    MAIL_TYPE.LOGIN_2FA,
                    {
                        otp: otpCode,
                        otpExpiresInMinutes: OTP_EXPIRE_MINUTES,
                    },
                );
                break;
            default:
                throw new BaseError(500, "Loại OTP không hợp lệ");
        }
        return otpCode;
    },

    async verifyOTP(userId, otpCode, otpType) {
        const otpRecord = await OTPRepository.findValidOTP(userId, otpCode, otpType);
        if (!otpRecord) {
            throw new BaseError(400, "OTP không hợp lệ hoặc đã hết hạn");
        }
        await OTPRepository.markUsed(otpRecord.id);
        return true;
    },
};

export default OTPService;