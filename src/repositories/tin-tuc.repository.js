import prisma from "../config/database.config.js";

const TinTucRepository = {
    async create(data) {
        return prisma.tin_tuc.create({
            data
        });
    },

    async findById(id) {
        return prisma.tin_tuc.findFirst({
            where: {
                id: id,
            }
        });
    },

    async update(id, data) {
        return prisma.tin_tuc.update({
            where: { id },
            data
        });
    },

    async getDetails(id) {
        return prisma.tin_tuc.findFirst({
            where: { id },
            include: {
                dinh_kem_tin_tuc: true,
                danh_muc_tin_tuc: true,
            }
        });
    },

    async getAll(page, size, idDanhMuc, isRemoved) {
        console.log(idDanhMuc)
        const skip = (page - 1) * size;
        const where = {
            ...(isRemoved !== undefined && isRemoved !== ''
                ? { is_removed: isRemoved === 'true' }
                : {}),
            ...(idDanhMuc ? { id_danh_muc: idDanhMuc } : {}),
        }
        const [data, totalItems] = await Promise.all([
            prisma.tin_tuc.findMany({
                where,
                skip,
                take: size,
                orderBy: {
                    thoi_gian_tao: 'desc'
                },
                include: {
                    danh_muc_tin_tuc: true,
                },
            }),
            prisma.tin_tuc.count({ where }),
        ]);
        return { data, totalItems }
    },

    async delete(id, includeAttachments = false) {
        return prisma.$transaction(async (tx) => {
            if (includeAttachments) {
                await tx.dinh_kem_tin_tuc.deleteMany({
                    where: { id_tin_tuc: id },
                });
            }

            const deletedTinTuc = await tx.tin_tuc.delete({
                where: { id },
            });

            return deletedTinTuc;
        });
    },
};

export default TinTucRepository;