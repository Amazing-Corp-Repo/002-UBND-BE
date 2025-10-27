import prisma from "../config/database.config.js";

const UyBanRepository = {
    async create(data) {
        return await prisma.uy_ban.create({
            data
        });
    },

    async findById(id) {
        return await prisma.uy_ban.findFirst({
            where: {
                id,
                is_removed: false
            }
        });
    },

    async findFirst() {
        return await prisma.uy_ban.findFirst();
    },

    async update(id, data) {
        return await prisma.uy_ban.update({
            where: { id },
            data
        });
    },
};

export default UyBanRepository;