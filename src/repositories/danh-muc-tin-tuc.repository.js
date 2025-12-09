import prisma from "../config/database.config.js";

const DanhMucTinTucRepository = {
    async create(data) {
        return prisma.danh_muc_tin_tuc.create({
            data
        });
    },

    async findByTenDanhMuc(tenDanhMuc) {
        return prisma.danh_muc_tin_tuc.findFirst({
            where: {
                ten_danh_muc: tenDanhMuc,
                is_delete: false
            }
        });
    },

    async findByTenDanhMucExcludingId(id, tenDanhMuc) {
        return prisma.danh_muc_tin_tuc.findFirst({
            where: {
                ten_danh_muc: tenDanhMuc,
                id: { not: id },
                is_delete: false
            }
        });
    },

    async findById(id) {
        return prisma.danh_muc_tin_tuc.findFirst({
            where: {
                id: id,
                is_delete: false
            }
        });
    },

    async update(id, data) {
        return prisma.danh_muc_tin_tuc.update({
            where: { id },
            data
        });
    },

    async findAll(isActive, search) {
        const where = {
            ...(isActive !== undefined && isActive !== ''
                ? { is_active: isActive === 'true' }
                : {}),
            is_delete: false,
            ...(search
                ? {
                    OR: [{ ten_danh_muc: { contains: search, mode: "insensitive" } }],
                }
                : {}),
        };
        return prisma.danh_muc_tin_tuc.findMany({
            where,
        });
    },

    async findAllWithPagination(isActive, search, page, size) {
        const skip = (page - 1) * size;
        const where = {
            ...(isActive !== undefined && isActive !== ''
                ? { is_active: isActive === 'true' }
                : {}),
            is_delete: false,
            ...(search
                ? {
                    OR: [{ ten_danh_muc: { contains: search, mode: "insensitive" } }],
                }
                : {}),
        };
        const [data, totalItems] = await Promise.all([
            prisma.danh_muc_tin_tuc.findMany({
                where,
                skip,
                take: size,
            }),
            prisma.danh_muc_tin_tuc.count({ where }),
        ]);
        return {
            data,
            totalItems,
        }
    },

    async countTinTucByDanhMuc() {
        const [danhMucs, tinTucCounts] = await Promise.all([
            prisma.danh_muc_tin_tuc.findMany({
                where: {
                    is_delete: false,
                    is_active: true,
                },
                select: {
                    id: true,
                    ten_danh_muc: true,
                },
            }),
            prisma.tin_tuc.groupBy({
                by: ["id_danh_muc"],
                where: {
                    is_delete: false,
                },
                _count: {
                    id: true,
                },
            }),
        ]);

        return danhMucs.map((dm) => {
            const countRecord = tinTucCounts.find(
                (item) => item.id_danh_muc === dm.id
            );

            return {
                id: dm.id,
                ten_danh_muc: dm.ten_danh_muc,
                tong_tin_tuc: countRecord?._count.id ?? 0,
            };
        });
    },
};

export default DanhMucTinTucRepository;