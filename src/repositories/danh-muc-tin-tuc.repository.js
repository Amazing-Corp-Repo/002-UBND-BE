import prisma from "../config/database.config.js";

const DanhMucTinTucRepository = {
    async create(data) {
        return prisma.danh_muc_tin_tuc.create({
            data
        });
    },

    async findByTenDanhMuc(tenDanhMuc, is_removed = false) {
        return prisma.danh_muc_tin_tuc.findFirst({
            where: {
                ten_danh_muc: tenDanhMuc,
                is_removed: is_removed
            }
        });
    },

    async findById(id, isRemoved) {
        return prisma.danh_muc_tin_tuc.findFirst({
            where: {
                id: id,
                is_removed: isRemoved
            }
        });
    },

    async update(id, data) {
        return prisma.danh_muc_tin_tuc.update({
            where: { id },
            data
        });
    },

    async delete(id) {
        return prisma.danh_muc_tin_tuc.delete({
            where: { id }
        });
    },

    async findAll(is_removed) {
        const where = {
            ...(is_removed !== undefined && is_removed !== ''
                ? { is_removed: is_removed === 'true' }
                : {}),
        };
        return prisma.danh_muc_tin_tuc.findMany({
            where,
        });
    }
};

export default DanhMucTinTucRepository;