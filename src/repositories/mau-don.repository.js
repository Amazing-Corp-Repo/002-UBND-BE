import prisma from "../config/database.config.js";

const MauDonRepository = {
    async createMauDon(data) {
        return await prisma.mau_don.create({
            data
        });
    },

    async updateMauDon(id, data) {
        return await prisma.mau_don.update({
            where: { id },
            data
        });
    },

    async getMauDonById(id) {
        return await prisma.mau_don.findUnique({
            where: { id }
        });
    },

    async checkMauDonInThuTuc(mauDonId) {
        const count = await prisma.thu_tuc_hanh_chinh_mau_don.count({
            where: { 
                id_mau_don: mauDonId,
                thu_tuc_hanh_chinh: {
                    is_active: true,
                    is_delete: false,
                }
            },
        });
        return count > 0;
    },

    async findManyByIds(list, is_active = true) {
        if (!Array.isArray(list) || list.length === 0) {
            return [];
        }

        const ids = list
            .map(item => item.id)
            .filter(id => !!id);

        if (ids.length === 0) {
            return [];
        }

        return await prisma.mau_don.findMany({
            where: {
                id: { in: ids },
                is_active,
                is_delete: false,
            },
        });
    },

    async getAllMauDon(isActive, search) {
        const where = {
            ...(isActive !== undefined && isActive !== ''
                ? { is_active: isActive === 'true' }
                : {}),
            ...(search
                ? {
                    OR: [{ ten_mau_don: { contains: search, mode: "insensitive" } }],
                }
                : {}),
            is_delete: false,
        }
        return await prisma.mau_don.findMany({
            where,
            orderBy: { thoi_gian_tao: 'desc' },
        });
    },

    async findByNameOrCodeExcludeId(id, tenMauDon, maMauDon) {
        const whereCondition = {
            is_delete: false,
            id: { not: id },
            ...(maMauDon && maMauDon !== '' ? { OR: [{ ten_mau_don: tenMauDon }, { ma_mau_don: maMauDon }] } : { ten_mau_don: tenMauDon }),
        };

        return await prisma.mau_don.findFirst({
            where: whereCondition,
        });
    },

    async findByNameOrCode(tenMauDon, maMauDon) {
        const whereCondition = {
            is_delete: false,
            ...(maMauDon && maMauDon !== '' ? { OR: [{ ten_mau_don: tenMauDon }, { ma_mau_don: maMauDon }] } : { ten_mau_don: tenMauDon }),
        };
        return await prisma.mau_don.findFirst({
            where: whereCondition,
        });
    },

    async getAllMauDonWithPaging(page, size, isActive, search) {
        const where = {
            ...(isActive !== undefined && isActive !== ''
                ? { is_active: isActive === 'true' }
                : {}),
            ...(search
                ? {
                    OR: [{ ten_mau_don: { contains: search, mode: "insensitive" } }],
                }
                : {}),
            is_delete: false,
        };
        let [data, totalItems] = await Promise.all([
            prisma.mau_don.findMany({
                where,
                orderBy: { thoi_gian_tao: 'desc' },
                skip: (page - 1) * size,
                take: size * 1,
            }),
            prisma.mau_don.count({ where }),
        ]);
        return [data, totalItems];
    }
};

export default MauDonRepository;