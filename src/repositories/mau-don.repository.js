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


    async getAllMauDon(is_removed) {
        const where = {
            ...(is_removed !== undefined && is_removed !== ''
                ? { is_removed: is_removed === 'true' }
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
    }
};

export default MauDonRepository;