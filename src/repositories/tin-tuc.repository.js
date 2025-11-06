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

    async getAll(page, size, idDanhMuc, isActive, search) {
        const skip = (page - 1) * size;
        const where = {
            ...(isActive !== undefined && isActive !== ''
                ? { is_active: isActive === 'true' }
                : {}),
            ...(idDanhMuc ? { id_danh_muc: idDanhMuc } : {}),
            is_delete: false,
            ...(search !== undefined && search !== ''
                ? { tieu_de: { contains: search, mode: 'insensitive' } }
                : {}),

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

    async findByIdDanhMuc(id) {
        return prisma.tin_tuc.findFirst({
            where: {
                id_danh_muc: id,
                is_delete: false,
            }
        });
    },
};

export default TinTucRepository;