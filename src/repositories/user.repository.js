import prisma from "../config/database.config.js";

const UserRepository = {
    async findUserByUsername(ten_dang_nhap) {
        return await prisma.nguoi_dung.findUnique({
            where: {
                ten_dang_nhap,
                is_delete: false
            }
        });
    },

    async createUser(userData) {
        return await prisma.nguoi_dung.create({
            data: userData
        });
    },

    async updateUser(userId, updateData) {
        return await prisma.nguoi_dung.update({
            where: { id: userId },
            data: updateData
        });
    },

    async findById(userId) {
        return await prisma.nguoi_dung.findUnique({
            where: {
                id: userId,
                is_delete: false
            }
        });
    },

    async getAllUsers(page, size, isActive, role, search) {
        const where = {
            ...(isActive !== undefined && isActive !== ""
                ? { is_active: isActive === "true" }
                : {}),
            is_delete: false,
            ...(role !== undefined && role !== ""
                ? { vai_tro: role }
                : {}),
            ...(search
                ? {
                    OR: [
                        { ten_dang_nhap: { contains: search, mode: 'insensitive' } },
                        { ho_va_ten: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                }
                : {})
        };
        const skip = (page - 1) * size;
        const [users, total] = await Promise.all([
            prisma.nguoi_dung.findMany({
                skip,
                take: size,
                where: {
                    ...where,
                    is_delete: false
                },
                orderBy: { ten_dang_nhap: 'asc' }
            }),
            prisma.nguoi_dung.count(
                { where }
            )
        ]);

        return { users, total };
    },

    async findByUsernameOrEmail(ten_dang_nhap, email) {
        return await prisma.nguoi_dung.findFirst({
            where: {
                OR: [
                    { ten_dang_nhap },
                    { email }
                ],
                is_delete: false
            }
        });
    },

    async findByUsername(ten_dang_nhap) {
        return await prisma.nguoi_dung.findFirst({
            where: {
                ten_dang_nhap,
                is_delete: false
            }
        });
    },

    async findByEmail(email) {
        return await prisma.nguoi_dung.findFirst({
            where: {
                email,
                is_delete: false
            }
        });
    },

    async updateStatusByAdmin(userId, isActive, currentUser) {
        return await prisma.nguoi_dung.update({
            where: { id: userId },
            data: {
                is_active: isActive,
                nguoi_cap_nhat: currentUser,
                thoi_gian_cap_nhat: new Date().toISOString()
            }
        });
    }
}

export default UserRepository;