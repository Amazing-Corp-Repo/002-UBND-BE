import prisma from "../config/database.config.js";

const CoSoDichVuCongRepository = {
    async findById(id) {
        return await prisma.co_so_dich_vu_cong.findFirst({
            where: {
                id,
            },
        });
    },

    async getAll(isActive, search) {
        const where = {
            ...(isActive !== undefined && isActive !== ""
                ? { is_active: isActive === "true" }
                : {}),
            ...(search
                ? {
                    OR: [{ ten_co_so: { contains: search, mode: "insensitive" } }],
                }
                : {}),
            is_delete: false,
        };
        const items = await prisma.co_so_dich_vu_cong.findMany({
            where,
            orderBy: {
                thoi_gian_tao: "desc",
            },
        });
        return items;
    },

    async getAllWithPagination(isActive, search, page, size) {
        const skip = (page - 1) * size;
        const where = {
            ...(isActive !== undefined && isActive !== ""
                ? { is_active: isActive === "true" }
                : {}),
            ...(search
                ? {
                    OR: [{ ten_co_so: { contains: search, mode: "insensitive" } }],
                }
                : {}),
            is_delete: false,
        };
        const [data, totalItems] = await Promise.all([
            prisma.co_so_dich_vu_cong.findMany({
                where,
                orderBy: {
                    thoi_gian_tao: "desc",
                },
                skip,
                take: size,
            }),
            prisma.co_so_dich_vu_cong.count({ where }),
        ]);
        
        return {
            data,
            totalItems,
        };
    },

    async findByName(tenCoSo) {
        return await prisma.co_so_dich_vu_cong.findFirst({
            where: {
                ten_co_so: tenCoSo,
                is_delete: false,
            },
        });
    },

    async create(data) {
        return await prisma.co_so_dich_vu_cong.create({
            data
        });
    },

    async findByNameExcludeId(id, tenCoSo) {
        return await prisma.co_so_dich_vu_cong.findFirst({
            where: {
                ten_co_so: tenCoSo,
                id: { not: id },
                is_delete: false,
            },
        });
    },

    async update(id, data) {
        return await prisma.co_so_dich_vu_cong.update({
            where: {
                id,
            },
            data
        });
    },

    async delete(id) {
        return await prisma.co_so_dich_vu_cong.delete({
            where: {
                id,
            },
        });
    }
};

export default CoSoDichVuCongRepository;