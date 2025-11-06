import prisma from '../config/database.config.js';

const LinhVucPhanAnhRepository = {
    async findByName(ten) {
        return await prisma.linh_vuc_phan_anh.findFirst({
            where: {
                ten: ten,
                is_delete: false,
            },
        });
    },

    async create(data) {
        return await prisma.linh_vuc_phan_anh.create({
            data: data,
        });
    },

    async getAll(page, size, search, isActive) {
        const skip = (page - 1) * size;
        const where = {
            ...(isActive !== undefined && isActive !== ''
                ? { is_active: isActive === 'true' }
                : {}),
            is_delete: false,
            ...(search !== undefined && search !== ''
                ? { ten: { contains: search, mode: 'insensitive' } }
                : {}),
        };
        const [data, totalItems] = await Promise.all([
            prisma.linh_vuc_phan_anh.findMany({
                where,
                skip,
                take: size,
                orderBy: {
                    thoi_gian_tao: 'desc',
                },
            }),
            prisma.linh_vuc_phan_anh.count({ where }),
        ]);
        return { data, totalItems };
    },
    async findById(id) {
        return await prisma.linh_vuc_phan_anh.findFirst({
            where: {
                id: id,
                is_delete: false,
            },
        });
    },

    async update(id, data) {
        return await prisma.linh_vuc_phan_anh.update({
            where: { id: id },
            data: data,
        });
    },

    async findByNameExcludingId(id, ten) {
        return await prisma.linh_vuc_phan_anh.findFirst({
            where: {
                ten: ten,
                id: { not: id },
                is_delete: false,
            },
        });
    },

    async countActiveReflections(idLinhVuc) {
        return await prisma.phan_anh.count({
            where: {
                id_linh_vuc_phan_anh: idLinhVuc,
            },
        });
    },
};

export default LinhVucPhanAnhRepository;