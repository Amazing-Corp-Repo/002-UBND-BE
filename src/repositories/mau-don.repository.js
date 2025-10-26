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
};

export default MauDonRepository;