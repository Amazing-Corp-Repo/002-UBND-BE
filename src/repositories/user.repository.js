import prisma from "../config/database.config.js";

const UserRepository = {
    async findUserByUsername(ten_dang_nhap) {
        return await prisma.nguoi_dung.findUnique({
            where: { ten_dang_nhap }
        });
    },

    async createUser(userData) {
        return await prisma.nguoi_dung.create({
            data: userData
        });
    },

    async updateUser(userId, updateData, auditFields = {}) {
        return await prisma.nguoi_dung.update({
            where: { id: userId },
            data: {
                ...updateData,
                ...auditFields,
            },
        });
    },

    async findById(userId) {
        return await prisma.nguoi_dung.findUnique({
            where: { id: userId }
        });
    },

    async getAllUsers(page, size) {
        const skip = (page - 1) * size;
        const [users, total] = await Promise.all([
            prisma.nguoi_dung.findMany({
                skip,
                take: size,
            }),
            prisma.nguoi_dung.count()
        ]);

        return { users, total };
    },

    async findByUsernameOrEmail(ten_dang_nhap, email) {
        return await prisma.nguoi_dung.findFirst({
            where: {
                OR: [
                    { ten_dang_nhap },
                    { email }
                ]
            }
        });
    },

    async findByUsername(ten_dang_nhap) {
        return await prisma.nguoi_dung.findFirst({
            where: { ten_dang_nhap }
        });
    },

    async findByEmail(email) {
        return await prisma.nguoi_dung.findFirst({
            where: { email }
        });
    }
}

export default UserRepository;