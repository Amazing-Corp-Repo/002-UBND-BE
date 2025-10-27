import prisma from "../config/database.config.js";

const LinhVucRepository = {
    async findManyByIds(ids, is_removed = false) {
        if (ids.length === 0) {
            return [];
        }
        return await prisma.linh_vuc.findMany({
            where: {
                id: {
                    in: ids,
                },
                is_remove: is_removed,
            },
        });
    },

    async getAll(is_removed) {
        const where = {
            ...(is_removed !== undefined && is_removed !== ''
                ? { is_remove: is_removed === 'true' }
                : {}),
        }
        console.log(where);
        return await prisma.linh_vuc.findMany({
            where,
        });
    }
};

export default LinhVucRepository;