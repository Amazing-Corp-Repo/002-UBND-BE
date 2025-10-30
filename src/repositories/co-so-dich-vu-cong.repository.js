import prisma from "../config/database.config.js";

const CoSoDichVuCongRepository = {
    async findById(id) {
        return await prisma.co_so_dich_vu_cong.findFirst({
            where: {
                id,
            },
        });
    },

    async getAll(is_removed, search) {
        console.log(is_removed, search);
        const where = {
            ...(is_removed !== undefined && is_removed !== ""
                ? { is_removed: is_removed === "true" }
                : {}),
            ...(search
                ? {
                    OR: [{ ten_co_so: { contains: search, mode: "insensitive" } }],
                }
                : {}),
        };
        const items = await prisma.co_so_dich_vu_cong.findMany({
            where,
            orderBy: {
                thoi_gian_tao: "desc",
            },
        });
        return items;
    },

    async findByName(tenCoSo) {
        return await prisma.co_so_dich_vu_cong.findFirst({
            where: {
                ten_co_so: tenCoSo,
                is_removed: false,
            },
        });
    },

    async create (idUyBan, tenCoSo, diaChi, soDienThoai, moTa, linkGoogleMap) {
        return await prisma.co_so_dich_vu_cong.create({
            data: {
                id_uy_ban: idUyBan,
                ten_co_so: tenCoSo,
                dia_chi: diaChi,
                so_dien_thoai: soDienThoai,
                mo_ta: moTa,
                link_google_map: linkGoogleMap,
            }
        });
    },

    async findByNameExcludeId(id, tenCoSo) {
        return await prisma.co_so_dich_vu_cong.findFirst({
            where: {
                ten_co_so: tenCoSo,
                id: { not: id },
                is_removed: false,
            },
        });
    },

    async update(id, idUyBan, tenCoSo, diaChi, soDienThoai, moTa, linkGoogleMap, isRemoved) {
        return await prisma.co_so_dich_vu_cong.update({
            where: {
                id,
            },
            data: {
                id_uy_ban: idUyBan,
                ten_co_so: tenCoSo,
                dia_chi: diaChi,
                so_dien_thoai: soDienThoai,
                mo_ta: moTa,
                link_google_map: linkGoogleMap,
                is_removed: isRemoved,
            }
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