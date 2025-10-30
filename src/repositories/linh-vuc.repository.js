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
    },

    async findByTenLinhVuc(ten_linh_vuc, is_removed = false) {
        return await prisma.linh_vuc.findFirst({
            where: {
                ten_linh_vuc,
                is_remove: is_removed,
            },
        });
    },

    async findById(id) {
        return await prisma.linh_vuc.findUnique({
            where: { id },
        });
    },

    async findByTenLinhVucExcludeId(ten_linh_vuc, excludeId, is_removed = false) {
        return await prisma.linh_vuc.findFirst({
            where: {
                ten_linh_vuc,
                is_remove: is_removed,
                NOT: { id: excludeId },
            },
        });
    },

    async create(ten_linh_vuc, mo_ta) {
        return await prisma.linh_vuc.create({
            data: {
                ten_linh_vuc,
                mo_ta: mo_ta || null,
            },
        });
    },

    async update(id, ten_linh_vuc, mo_ta, is_remove, nguoi_cap_nhap) {
        return await prisma.linh_vuc.update({
            where: { id },
            data: {
                ten_linh_vuc,
                mo_ta: mo_ta !== undefined ? (mo_ta || null) : undefined,
                is_remove: is_remove !== undefined ? is_remove : undefined,
                nguoi_cap_nhap,
            },
        });
    },

    async countThuTucLinks(id_linh_vuc) {
        return await prisma.thu_tuc_hanh_chinh_linh_vuc.count({
            where: {
                id_linh_vuc,
                thu_tuc_hanh_chinh: { is_removed: false },
            },
        });
    },

    async hardDelete(id) {
        return await prisma.linh_vuc.delete({
            where: { id },
        });
    },
};

export default LinhVucRepository;