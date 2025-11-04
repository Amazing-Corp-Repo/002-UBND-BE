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
    }
};

export default DanhMucTinTucRepository;