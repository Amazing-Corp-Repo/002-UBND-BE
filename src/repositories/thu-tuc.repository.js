import prisma from "../config/database.config.js"

const handleTrinhTuThucHienUpdate = async (tx, id_thu_tuc, list = []) => {
    const existing = await tx.trinh_tu_thuc_hien_thu_tuc.findMany({
        where: { id_thu_tuc },
    });

    const incomingIds = list.filter(i => i.id).map(i => i.id);
    const existingIds = existing.map(i => i.id);
    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

    if (idsToDelete.length) {
        for (const id of idsToDelete) {
            await tx.trinh_tu_thuc_hien_thu_tuc.delete({
                where: { id },
            });
        }
    }

    for (const item of list.filter(i => i.id)) {
        await tx.trinh_tu_thuc_hien_thu_tuc.update({
            where: { id: item.id },
            data: {
                ten_buoc: item.ten_buoc,
                mo_ta_buoc: item.mo_ta_buoc,
                thu_tu_buoc: item.thu_tu_buoc,
            },
        });
    }

    const newItems = list.filter(i => !i.id);
    if (newItems.length) {
        for (const i of newItems) {
            await tx.trinh_tu_thuc_hien_thu_tuc.create({
                data: {
                    id_thu_tuc,
                    ten_buoc: i.ten_buoc,
                    mo_ta_buoc: i.mo_ta_buoc,
                    thu_tu_buoc: i.thu_tu_buoc,
                },
            });
        }
    }
};

const handleCachThucThucHienUdpate = async (tx, id_thu_tuc, list = []) => {
    const existing = await tx.cach_thuc_thuc_hien.findMany({
        where: { id_thu_tuc },
    });

    const incomingIds = list.filter(i => i.id).map(i => i.id);
    const existingIds = existing.map(i => i.id);

    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (idsToDelete.length) {
        for (const id of idsToDelete) {
            await tx.cach_thuc_thuc_hien.delete({
                where: { id },
            });
        }
    }

    for (const item of list.filter(i => i.id)) {
        await tx.cach_thuc_thuc_hien.update({
            where: { id: item.id },
            data: {
                hinh_thuc_ap_dung: item.hinh_thuc_ap_dung,
                mo_ta_chi_tiet: item.mo_ta_chi_tiet,
                thoi_gian_giai_quyet: item.thoi_gian_giai_quyet,
                le_phi: item.le_phi,
                ghi_chu_le_phi: item.ghi_chu_le_phi,
            },
        });
    }

    const newItems = list.filter(i => !i.id);
    if (newItems.length) {
        for (const i of newItems) {
            await tx.cach_thuc_thuc_hien.create({
                data: {
                    id_thu_tuc,
                    hinh_thuc_ap_dung: i.hinh_thuc_ap_dung,
                    mo_ta_chi_tiet: i.mo_ta_chi_tiet,
                    thoi_gian_giai_quyet: i.thoi_gian_giai_quyet,
                    le_phi: i.le_phi,
                    ghi_chu_le_phi: i.ghi_chu_le_phi,
                },
            });
        }
    }
}

const handleLinhVucUpdate = async (tx, id_thu_tuc, danhSachLinhVuc = []) => {
    const existing = await tx.thu_tuc_hanh_chinh_linh_vuc.findMany({
        where: { id_thu_tuc_hanh_chinh: id_thu_tuc },
        select: { id_linh_vuc: true },
    });

    const existingIds = existing.map(e => e.id_linh_vuc);
    const incomingIds = danhSachLinhVuc;

    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (toDelete.length) {
        for (const id_linh_vuc of toDelete) {
            await tx.thu_tuc_hanh_chinh_linh_vuc.delete({
                where: {
                    id_thu_tuc_hanh_chinh_id_linh_vuc: {
                        id_thu_tuc_hanh_chinh: id_thu_tuc,
                        id_linh_vuc,
                    },
                },
            });
        }
    }

    const toAdd = incomingIds.filter(id => !existingIds.includes(id));
    if (toAdd.length) {
        for (const id_linh_vuc of toAdd) {
            await tx.thu_tuc_hanh_chinh_linh_vuc.create({
                data: {
                    id_thu_tuc_hanh_chinh: id_thu_tuc,
                    id_linh_vuc,
                },
            });
        }
    }
}

const handleMauDonUpdate = async (tx, id_thu_tuc, danhSachMauDon = []) => {

    const existing = await tx.thu_tuc_hanh_chinh_mau_don.findMany({
        where: { id_thu_tuc },
        select: {
            id_mau_don: true,
            ghi_chu: true,
            so_luong_ban_chinh: true,
            so_luong_ban_sao: true,
        },
    });

    const existingIds = existing.map(e => e.id_mau_don);
    const incomingIds = danhSachMauDon.map(e => e.id);

    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (toDelete.length) {
        for (const id_mau_don of toDelete) {
            await tx.thu_tuc_hanh_chinh_mau_don.delete({
                where: {
                    id_thu_tuc_id_mau_don: {
                        id_thu_tuc,
                        id_mau_don,
                    },
                },
            });
        }
    }

    for (const item of danhSachMauDon.filter(i => existingIds.includes(i.id))) {
        await tx.thu_tuc_hanh_chinh_mau_don.update({
            where: {
                id_thu_tuc_id_mau_don: {
                    id_thu_tuc,
                    id_mau_don: item.id,
                },
            },
            data: {
                so_luong_ban_chinh: item.so_luong_ban_chinh,
                so_luong_ban_sao: item.so_luong_ban_sao,
                ghi_chu: item.ghi_chu || null,
            },
        });
    }

    const toAdd = danhSachMauDon.filter(i => !existingIds.includes(i.id));
    if (toAdd.length) {
        for (const i of toAdd) {
            await tx.thu_tuc_hanh_chinh_mau_don.create({
                data: {
                    id_thu_tuc,
                    id_mau_don: i.id,
                    so_luong_ban_chinh: i.so_luong_ban_chinh,
                    so_luong_ban_sao: i.so_luong_ban_sao,
                    ghi_chu: i.ghi_chu || null,
                },
            });
        }
    }
};

const ThuTucRepository = {
    async findByIdFull(id) {
        console.log("Finding Thu Tuc by ID Full:", id);
        return await prisma.thu_tuc_hanh_chinh.findUnique({
            where: { id },
            include: {
                co_so_dich_vu_cong: true,
                cach_thuc_thuc_hien: {
                    where: { is_removed: false },
                },
                trinh_tu_thuc_hien_thu_tuc: {
                    where: { is_removed: false },
                    orderBy: { thu_tu_buoc: 'asc' },
                },
                thu_tuc_hanh_chinh_mau_don: {
                    where: {
                        mau_don: { is_removed: false },
                    },
                    include: {
                        mau_don: true,
                    },
                },
                thu_tuc_hanh_chinh_linh_vuc: {
                    where: {
                        linh_vuc: { is_remove: false },
                    },
                    include: {
                        linh_vuc: true,
                    },
                },
            },
        });
    },

    async getAll(page, size, is_removed, id_linh_vuc, search) {
        const skip = (page - 1) * size;

        const where = {
            ...(is_removed !== undefined && is_removed !== ''
                ? { is_removed: is_removed === 'true' }
                : {}),

            ...(search
                ? {
                    OR: [
                        { ten_thu_tuc: { contains: search, mode: 'insensitive' } },
                        { ma_thu_tuc: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),

            ...(id_linh_vuc
                ? {
                    thu_tuc_hanh_chinh_linh_vuc: {
                        some: { id_linh_vuc },
                    },
                }
                : {}),
        };

        const [thuTucs, total] = await Promise.all([
            prisma.thu_tuc_hanh_chinh.findMany({
                where,
                skip,
                take: size,
                orderBy: { thoi_gian_tao: 'desc' },
                include: {
                    co_so_dich_vu_cong: true,
                    thu_tuc_hanh_chinh_linh_vuc: {
                        include: { linh_vuc: true },
                    },
                },
            }),
            prisma.thu_tuc_hanh_chinh.count({ where }),
        ]);

        return { thuTucs, total };
    },

    async exists(thuTucId) {
        const count = await prisma.thu_tuc_hanh_chinh.count({
            where: {
                id: thuTucId,
                is_removed: false
            }
        });
        return count > 0;
    },

    async findByMaAndTenThuTuc(maThuTuc, tenThuTuc, is_removed = false) {
        return await prisma.thu_tuc_hanh_chinh.findFirst({
            where: {
                OR: [
                    { ma_thu_tuc: maThuTuc },
                    { ten_thu_tuc: tenThuTuc }
                ],
                is_removed
            },
        });
    },

    async createThuTuc(id_co_so_dich_vu_cong, ten_thu_tuc, ma_thu_tuc, doi_tuong_thuc_hien, yeu_cau_dieu_kien_chung, so_quyet_dinh, danh_sach_linh_vuc_ids, danh_sach_mau_don, cach_thu_thuc_hien, trinh_tu_thuc_hien) {
        return await prisma.$transaction(async (tx) => {
            const newThuTuc = await tx.thu_tuc_hanh_chinh.create({
                data: {
                    id_co_so_dich_vu_cong,
                    ten_thu_tuc,
                    ma_thu_tuc,
                    doi_tuong_thuc_hien,
                    yeu_cau_dieu_kien_chung,
                    so_quyet_dinh,
                },
            });

            await handleLinhVucUpdate(tx, newThuTuc.id, danh_sach_linh_vuc_ids);
            await handleMauDonUpdate(tx, newThuTuc.id, danh_sach_mau_don);
            await handleCachThucThucHienUdpate(tx, newThuTuc.id, cach_thu_thuc_hien);
            await handleTrinhTuThucHienUpdate(tx, newThuTuc.id, trinh_tu_thuc_hien);

            return await tx.thu_tuc_hanh_chinh.findUnique({
                where: { id: newThuTuc.id },
                include: {
                    thu_tuc_hanh_chinh_linh_vuc: true,
                    thu_tuc_hanh_chinh_mau_don: true,
                    cach_thuc_thuc_hien: true,
                    trinh_tu_thuc_hien_thu_tuc: {
                        orderBy: { thu_tu_buoc: 'asc' }
                    },
                }
            });
        });
    },

    async hardDeleteThuTuc(thuTucId) {
        await prisma.$transaction(async (tx) => {
            await tx.thu_tuc_hanh_chinh_linh_vuc.deleteMany({
                where: { id_thu_tuc_hanh_chinh: thuTucId },
            });
            await tx.thu_tuc_hanh_chinh_mau_don.deleteMany({
                where: { id_thu_tuc: thuTucId },
            });
            await tx.cach_thuc_thuc_hien.deleteMany({
                where: { id_thu_tuc: thuTucId },
            });
            await tx.trinh_tu_thuc_hien_thu_tuc.deleteMany({
                where: { id_thu_tuc: thuTucId },
            });
            await tx.thu_tuc_hanh_chinh.delete({
                where: { id: thuTucId },
            });
        });
    },

    async findByMaOrTenExcludeId(ma_thu_tuc, ten_thu_tuc, excludeId) {
        return await prisma.thu_tuc_hanh_chinh.findFirst({
            where: {
                is_removed: false,
                NOT: { id: excludeId },
                OR: [
                    { ma_thu_tuc },
                    { ten_thu_tuc },
                ],
            },
        });
    },

    async updateThuTuc(thuTucId, id_co_so_dich_vu_cong, ten_thu_tuc, ma_thu_tuc, doi_tuong_thuc_hien, yeu_cau_dieu_kien_chung, so_quyet_dinh, is_removed, danh_sach_linh_vuc_ids, danh_sach_mau_don, cach_thu_thuc_hien, trinh_tu_thuc_hien) {
        return await prisma.$transaction(async (tx) => {
            const updatedThuTuc = await tx.thu_tuc_hanh_chinh.update({
                where: { id: thuTucId },
                data: {
                    id_co_so_dich_vu_cong,
                    ten_thu_tuc,
                    ma_thu_tuc,
                    doi_tuong_thuc_hien,
                    yeu_cau_dieu_kien_chung,
                    so_quyet_dinh,
                    is_removed,
                },
            });

            await handleCachThucThucHienUdpate(tx, thuTucId, cach_thu_thuc_hien);
            await handleTrinhTuThucHienUpdate(tx, thuTucId, trinh_tu_thuc_hien);
            await handleLinhVucUpdate(tx, thuTucId, danh_sach_linh_vuc_ids);
            await handleMauDonUpdate(tx, thuTucId, danh_sach_mau_don);

            return await tx.thu_tuc_hanh_chinh.findUnique({
                where: { id: updatedThuTuc.id },
                include: {
                    thu_tuc_hanh_chinh_linh_vuc: true,
                    thu_tuc_hanh_chinh_mau_don: true,
                    cach_thuc_thuc_hien: true,
                    trinh_tu_thuc_hien_thu_tuc: {
                        orderBy: { thu_tu_buoc: 'asc' }
                    },
                }
            });
        });
    },

    async getMauDonByThuTucId(thuTucId) {
        const list = await prisma.thu_tuc_hanh_chinh_mau_don.findMany({
            where: {
                id_thu_tuc: thuTucId,
                mau_don: { is_removed: false },
            },
            include: {
                mau_don: true,
            },
        });

        // chỉ trả ra danh sách mau_don
        return list.map(item => item.mau_don);
    },

    async getAllForMobile(id_linh_vuc) {
        const where = {
            is_removed: false,
            ...(id_linh_vuc
                ? {
                    thu_tuc_hanh_chinh_linh_vuc: {
                        some: { id_linh_vuc },
                    },
                }
                : {}),
        };
        const data = await prisma.thu_tuc_hanh_chinh.findMany({
            where,
            orderBy: { thoi_gian_tao: 'desc' },
            include: {
                // 1️⃣ Cách thức thực hiện
                cach_thuc_thuc_hien: {
                    select: {
                        hinh_thuc_ap_dung: true,
                        le_phi: true,
                        thoi_gian_giai_quyet: true,
                    },
                },

                // 2️⃣ Lĩnh vực
                thu_tuc_hanh_chinh_linh_vuc: {
                    include: {
                        linh_vuc: {
                            select: { ten_linh_vuc: true },
                        },
                    },
                },
            },
        });

        // 4️⃣ Chuẩn hoá dữ liệu trả về cho mobile
        return data.map(tt => ({
            id: tt.id,
            ten_thu_tuc: tt.ten_thu_tuc,
            so_quyet_dinh: tt.so_quyet_dinh,
            doi_tuong_thuc_hien: tt.doi_tuong_thuc_hien,
            cach_thuc: tt.cach_thuc_thuc_hien?.map(c => ({
                hinh_thuc_ap_dung: c.hinh_thuc_ap_dung,
                le_phi: c.le_phi,
                thoi_gian_giai_quyet: c.thoi_gian_giai_quyet,
            })),
            linh_vuc: tt.thu_tuc_hanh_chinh_linh_vuc?.map(l => l.linh_vuc.ten_linh_vuc),
        }));
    },

    async getThuTucById(thuTucId) {
        return await prisma.thu_tuc_hanh_chinh.findUnique({
            where: {
                id: thuTucId
            },
        });
    }
};

export default ThuTucRepository;