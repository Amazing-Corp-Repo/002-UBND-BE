import prisma from "../config/database.config.js";

const LinhVucRepository = {
    async findManyByIds(ids, is_active = true) {
        if (ids.length === 0) {
            return [];
        }
        return await prisma.linh_vuc.findMany({
            where: {
                id: {
                    in: ids,
                },
                is_active,
                is_delete: false,
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
                    OR: [{ ten_linh_vuc: { contains: search, mode: "insensitive" } }],
                }
                : {}),
            is_delete: false,
        };
        return await prisma.linh_vuc.findMany({
            where,
        });
    },

    async getAllWithPagination(isActive, search, page, size) {
        const skip = (page - 1) * size;
        const where = {
            ...(isActive !== undefined && isActive !== ""
                ? { is_active: isActive === "true" }
                : {}),
            ...(search
                ? {
                    OR: [{ ten_linh_vuc: { contains: search, mode: "insensitive" } }],
                }
                : {}),
            is_delete: false,
        };
        const [data, totalItems] = await Promise.all([
            prisma.linh_vuc.findMany({
                where,
                skip,
                take: size,
                orderBy: {
                    thoi_gian_tao: "desc",
                }
            }),

            prisma.linh_vuc.count({ where })
        ]);

        return { data, totalItems };
    },

    async findByTenLinhVuc(ten_linh_vuc) {
        return await prisma.linh_vuc.findFirst({
            where: {
                ten_linh_vuc,
                is_delete: false,
            },
        });
    },

    async findById(id) {
        return await prisma.linh_vuc.findUnique({
            where: { id },
        });
    },

    async findByTenLinhVucExcludeId(ten_linh_vuc, excludeId) {
        return await prisma.linh_vuc.findFirst({
            where: {
                ten_linh_vuc,
                is_delete: false,
                NOT: { id: excludeId },
            },
        });
    },

    async create(data) {
        return await prisma.linh_vuc.create({
            data,
        });
    },

    async update(id, data) {
        return await prisma.linh_vuc.update({
            where: { id },
            data
        });
    },

    async countThuTucLinks(id_linh_vuc) {
        return await prisma.thu_tuc_hanh_chinh_linh_vuc.count({
            where: {
                id_linh_vuc,
                thu_tuc_hanh_chinh: {
                    is_active: true,
                    is_delete: false
                },
            },
        });
    },
};

export default LinhVucRepository;