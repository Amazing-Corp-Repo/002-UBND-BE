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
            where: { id_mau_don: mauDonId },
        });
        return count > 0;
    },

    async findManyByIds(list, is_removed = false) {
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
                is_removed,
            },
        });
    },


    async getAllMauDon(is_removed, search) {
        const where = {
            ...(is_removed !== undefined && is_removed !== ''
                ? { is_removed: is_removed === 'true' }
                : {}),
            ...(search
                ? {
                    OR: [{ ten_mau_don: { contains: search, mode: "insensitive" } }],
                }
                : {}),
        }
        return await prisma.mau_don.findMany({
            where,
            orderBy: { thoi_gian_tao: 'desc' },
        });
    },

    async deleteMauDon(id) {
        return await prisma.mau_don.delete({
            where: { id }
        });
    },

    async getMauDonByMaMauDon(maMauDon) {
        return await prisma.mau_don.findFirst({
            where: { ma_mau_don: maMauDon }
        });
    },

    async getMauDonByTenMauDon(tenMauDon) {
        return await prisma.mau_don.findFirst({
            where: { ten_mau_don: tenMauDon }
        });
    },

    async findByNameOrCodeExcludeId(id, tenMauDon, maMauDon) {
        return await prisma.mau_don.findFirst({
            where: {
                is_removed: false,
                id: { not: id },
                OR: [
                    { ten_mau_don: tenMauDon },
                    { ma_mau_don: maMauDon },
                ],
            },
        });
    },

    async findByNameOrCode(tenMauDon, maMauDon) {
        return await prisma.mau_don.findFirst({
            where: {
                is_removed: false,
                OR: [
                    { ten_mau_don: tenMauDon },
                    { ma_mau_don: maMauDon },
                ],
            },
        });
    },
};

export default MauDonRepository;