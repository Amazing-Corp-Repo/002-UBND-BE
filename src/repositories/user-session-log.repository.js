import prisma from '../config/database.config.js';

const UserSessionLogRepository = {
    async createLog(data) {
        return prisma.user_session_logs.create({data});
    },

    async endSession(userId) {
        return prisma.user_session_logs.updateMany({
            where: { id_nguoi_dung: userId, is_active: true },
            data: { 
                is_active: false,
                thoi_gian_dang_xuat: new Date().toISOString()
            }
        });
    }
};

export default UserSessionLogRepository;