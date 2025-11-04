import prisma from "../config/database.config.js";

const OTPRepository = {
    async create(data) {
        return await prisma.otp.create({ data });
    },

    async findValidOTP(userId, otp, loai_otp) {
        return await prisma.otp.findFirst({
            where: {
                id_nguoi_dung: userId,
                ma_otp: otp,
                loai_otp,
                is_used: false,
                expires_at: { gt: new Date().toISOString() },
            },
        });
    },

    async markUsed(id) {
        await prisma.otp.update({
            where: { id },
            data: { is_used: true },
        });
    },
};

export default OTPRepository;
