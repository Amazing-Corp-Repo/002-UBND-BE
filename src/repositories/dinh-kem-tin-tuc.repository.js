import prisma from "../config/database.config.js";

const DinhKemTinTucRepository = {
    async create(data) {
        return prisma.dinh_kem_tin_tuc.create({
            data
        });
    },

    async getDinhKemByTinTucId(idTinTuc) {
        return prisma.dinh_kem_tin_tuc.findMany({
            where: {
                id_tin_tuc: idTinTuc,
            }
        });
    },
};

export default DinhKemTinTucRepository;