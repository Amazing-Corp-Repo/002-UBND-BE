import prisma from "../config/database.config.js"

const handleTrinhTuThucHienUpdate = async (tx, id_thu_tuc, list = [], currentUser = null) => {
    const existing = await tx.trinh_tu_thuc_hien_thu_tuc.findMany({
        where: { id_thu_tuc },
    });

    const incomingIds = list.filter(i => i.id).map(i => i.id);
    const existingIds = existing.map(i => i.id);
    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));

    if (idsToDelete.length) {
        await tx.trinh_tu_thuc_hien_thu_tuc.deleteMany({
            where: { id_thu_tuc, id: { in: idsToDelete } },
        });
    }

    const itemsToUpdate = list.filter(i => i.id);
    const idsToUpdate = itemsToUpdate.map(i => i.id);

    if (idsToUpdate.length) {
        // set metadata for all incoming items in one shot
        await tx.trinh_tu_thuc_hien_thu_tuc.updateMany({
            where: { id_thu_tuc, id: { in: idsToUpdate } },
            data: {
                nguoi_cap_nhat: currentUser,
                thoi_gian_cap_nhat: new Date().toISOString(),
            },
        });

        // update item-specific fields in parallel
        await Promise.all(
            itemsToUpdate.map(item => tx.trinh_tu_thuc_hien_thu_tuc.update({
                where: { id: item.id },
                data: {
                    ten_buoc: item.tenBuoc,
                    mo_ta_buoc: item.moTaBuoc,
                    thu_tu_buoc: item.thuTuBuoc,
                },
            }))
        );
    }

    const newItems = list.filter(i => !i.id);
    if (newItems.length) {
        const createData = newItems.map(i => ({
            id_thu_tuc,
            ten_buoc: i.tenBuoc,
            mo_ta_buoc: i.moTaBuoc,
            thu_tu_buoc: i.thuTuBuoc,
            nguoi_tao: currentUser,
            thoi_gian_tao: new Date().toISOString(),
        }));

        await tx.trinh_tu_thuc_hien_thu_tuc.createMany({ data: createData });
    }
};

const handleCachThucThucHienUdpate = async (tx, id_thu_tuc, list = [], currentUser = null) => {
    const existing = await tx.cach_thuc_thuc_hien.findMany({
        where: { id_thu_tuc },
    });

    const incomingIds = list.filter(i => i.id).map(i => i.id);
    const existingIds = existing.map(i => i.id);

    const idsToDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (idsToDelete.length) {
        await tx.cach_thuc_thuc_hien.deleteMany({ where: { id_thu_tuc, id: { in: idsToDelete } } });
    }

    const itemsToUpdate = list.filter(i => i.id);
    const idsToUpdate = itemsToUpdate.map(i => i.id);

    if (idsToUpdate.length) {
        await tx.cach_thuc_thuc_hien.updateMany({
            where: { id_thu_tuc, id: { in: idsToUpdate } },
            data: {
                nguoi_cap_nhat: currentUser,
                thoi_gian_cap_nhat: new Date().toISOString(),
            },
        });

        await Promise.all(
            itemsToUpdate.map(item => tx.cach_thuc_thuc_hien.update({
                where: { id: item.id },
                data: {
                    hinh_thuc_ap_dung: item.hinhThucApDung,
                    mo_ta_chi_tiet: item.moTaChiTiet,
                    thoi_gian_giai_quyet: item.thoiGianGiaiQuyet,
                    le_phi: item.lePhi,
                    ghi_chu_le_phi: item.ghiChuLePhi,
                },
            }))
        );
    }

    const newItems = list.filter(i => !i.id);
    if (newItems.length) {
        const createData = newItems.map(i => ({
            id_thu_tuc,
            hinh_thuc_ap_dung: i.hinhThucApDung,
            mo_ta_chi_tiet: i.moTaChiTiet,
            thoi_gian_giai_quyet: i.thoiGianGiaiQuyet,
            le_phi: i.lePhi,
            ghi_chu_le_phi: i.ghiChuLePhi,
            nguoi_tao: currentUser,
            thoi_gian_tao: new Date().toISOString(),
        }));

        await tx.cach_thuc_thuc_hien.createMany({ data: createData });
    }
}

const handleLinhVucUpdate = async (tx, id_thu_tuc, danhSachLinhVuc = [], currentUser = null) => {
    const existing = await tx.thu_tuc_hanh_chinh_linh_vuc.findMany({
        where: { id_thu_tuc_hanh_chinh: id_thu_tuc },
        select: { id_linh_vuc: true },
    });

    const existingIds = existing.map(e => e.id_linh_vuc);
    const incomingIds = danhSachLinhVuc;

    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (toDelete.length) {
        await tx.thu_tuc_hanh_chinh_linh_vuc.deleteMany({
            where: {
                id_thu_tuc_hanh_chinh: id_thu_tuc,
                id_linh_vuc: { in: toDelete },
            },
        });
    }

    const toAdd = incomingIds.filter(id => !existingIds.includes(id));
    if (toAdd.length) {
        const createData = toAdd.map(id_linh_vuc => ({
            id_thu_tuc_hanh_chinh: id_thu_tuc,
            id_linh_vuc,
            nguoi_tao: currentUser,
            thoi_gian_tao: new Date().toISOString(),
        }));

        await tx.thu_tuc_hanh_chinh_linh_vuc.createMany({ data: createData });
    }
}

const handleMauDonUpdate = async (tx, id_thu_tuc, danhSachMauDon = [], currentUser = null) => {

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
        await tx.thu_tuc_hanh_chinh_mau_don.deleteMany({
            where: {
                id_thu_tuc: id_thu_tuc,
                id_mau_don: { in: toDelete },
            },
        });
    }

    const itemsToUpdate = danhSachMauDon.filter(i => existingIds.includes(i.id));
    const idsToUpdate = itemsToUpdate.map(i => i.id);

    if (idsToUpdate.length) {
        // set metadata for all updated relations
        await tx.thu_tuc_hanh_chinh_mau_don.updateMany({
            where: {
                id_thu_tuc,
                id_mau_don: { in: idsToUpdate },
            },
            data: {
                nguoi_cap_nhat: currentUser,
                thoi_gian_cap_nhat: new Date().toISOString(),
            },
        });

        // then update item-specific fields in parallel
        await Promise.all(
            itemsToUpdate.map(item => tx.thu_tuc_hanh_chinh_mau_don.update({
                where: {
                    id_thu_tuc_id_mau_don: {
                        id_thu_tuc,
                        id_mau_don: item.id,
                    },
                },
                data: {
                    so_luong_ban_chinh: item.soLuongBanChinh,
                    so_luong_ban_sao: item.soLuongBanSao,
                    ghi_chu: item.ghiChu || null,
                },
            }))
        );
    }

    const toAdd = danhSachMauDon.filter(i => !existingIds.includes(i.id));
    if (toAdd.length) {
        const createData = toAdd.map(i => ({
            id_thu_tuc,
            id_mau_don: i.id,
            so_luong_ban_chinh: i.soLuongBanChinh,
            so_luong_ban_sao: i.soLuongBanSao,
            ghi_chu: i.ghiChu || null,
            nguoi_tao: currentUser,
            thoi_gian_tao: new Date().toISOString(),
        }));

        await tx.thu_tuc_hanh_chinh_mau_don.createMany({ data: createData });
    }
};

const handleThanhPhanHoSoForTruongHop = async (tx, id_truong_hop, list = [], currentUser = null) => {
    const existing = await tx.thanh_phan_ho_so.findMany({
        where: { id_truong_hop },
        select: { id: true },
    });

    const existingIds = existing.map(e => e.id);
    const incomingIds = (list || []).filter(i => i.id).map(i => i.id);

    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (toDelete.length) {
        await tx.thanh_phan_ho_so.deleteMany({ where: { id_truong_hop, id: { in: toDelete } } });
    }

    const itemsToUpdate = (list || []).filter(i => i.id);
    const idsToUpdate = itemsToUpdate.map(i => i.id);

    if (idsToUpdate.length) {
        await tx.thanh_phan_ho_so.updateMany({
            where: { id_truong_hop, id: { in: idsToUpdate } },
            data: {
                nguoi_cap_nhat: currentUser,
                thoi_gian_cap_nhat: new Date().toISOString(),
            },
        });

        await Promise.all(
            itemsToUpdate.map(item => tx.thanh_phan_ho_so.update({
                where: { id: item.id },
                data: {
                    ten_thanh_phan: item.tenThanhPhan,
                    mo_ta_chi_tiet: item.moTaChiTiet,
                    so_luong_ban_chinh: item.soLuongBanChinh,
                    so_luong_ban_sao: item.soLuongBanSao,
                    ghi_chu: item.ghiChu || null,
                },
            }))
        );
    }

    const toAdd = (list || []).filter(i => !i.id);
    if (toAdd.length) {
        const createData = toAdd.map(i => ({
            id_truong_hop,
            ten_thanh_phan: i.tenThanhPhan,
            mo_ta_chi_tiet: i.moTaChiTiet,
            so_luong_ban_chinh: i.soLuongBanChinh,
            so_luong_ban_sao: i.soLuongBanSao,
            ghi_chu: i.ghiChu || null,
            nguoi_tao: currentUser,
            thoi_gian_tao: new Date().toISOString(),
        }));

        await tx.thanh_phan_ho_so.createMany({ data: createData });
    }
};

const handleTruongHopUpdate = async (tx, id_thu_tuc, list = [], currentUser = null) => {
    const existing = await tx.truong_hop_thu_tuc.findMany({
        where: { id_thu_tuc },
        select: { id: true },
    });

    const existingIds = existing.map(e => e.id);
    const incomingIds = (list || []).filter(i => i.id).map(i => i.id);

    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    if (toDelete.length) {
        // deleting parents will cascade to children if DB is configured with Cascade
        await tx.truong_hop_thu_tuc.deleteMany({ where: { id_thu_tuc, id: { in: toDelete } } });
    }

    const itemsToUpdate = (list || []).filter(i => i.id);
    const idsToUpdate = itemsToUpdate.map(i => i.id);

    if (idsToUpdate.length) {
        await tx.truong_hop_thu_tuc.updateMany({
            where: { id_thu_tuc, id: { in: idsToUpdate } },
            data: {
                nguoi_cap_nhat: currentUser,
                thoi_gian_cap_nhat: new Date().toISOString(),
            },
        });

        await Promise.all(
            itemsToUpdate.map(item => tx.truong_hop_thu_tuc.update({
                where: { id: item.id },
                data: {
                    ten_truong_hop: item.tenTruongHop,
                    mo_ta: item.moTa || null,
                    thu_tu: item.thuTu || null,
                },
            }).then(async (updated) => {
                // handle nested thanh_phan for this updated parent
                if (item.thanhPhanHoSo && Array.isArray(item.thanhPhanHoSo)) {
                    await handleThanhPhanHoSoForTruongHop(tx, item.id, item.thanhPhanHoSo, currentUser);
                }
            }))
        );
    }

    const toAdd = (list || []).filter(i => !i.id);
    if (toAdd.length) {
        // create parents individually to obtain ids so we can attach children
        await Promise.all(
            toAdd.map(async (i) => {
                const created = await tx.truong_hop_thu_tuc.create({
                    data: {
                        id_thu_tuc,
                        ten_truong_hop: i.tenTruongHop,
                        mo_ta: i.moTa || null,
                        thu_tu: i.thuTu || null,
                        nguoi_tao: currentUser,
                        thoi_gian_tao: new Date().toISOString(),
                    },
                });

                if (i.thanhPhanHoSo && Array.isArray(i.thanhPhanHoSo) && i.thanhPhanHoSo.length) {
                    await handleThanhPhanHoSoForTruongHop(tx, created.id, i.thanhPhanHoSo, currentUser);
                }
            })
        );
    }
};

const ThuTucRepository = {
    async findByIdFull(id) {
        return await prisma.thu_tuc_hanh_chinh.findUnique({
            where: { id },
            include: {
                co_so_dich_vu_cong: true,
                cach_thuc_thuc_hien: {
                    where: {
                        is_delete: false,
                        is_active: true
                    },
                },
                trinh_tu_thuc_hien_thu_tuc: {
                    where: {
                        is_delete: false,
                        is_active: true
                    },
                    orderBy: { thu_tu_buoc: 'asc' },
                },
                thu_tuc_hanh_chinh_mau_don: {
                    where: {
                        mau_don: {
                            is_delete: false,
                            is_active: true
                        },
                    },
                    include: {
                        mau_don: true,
                    },
                },
                thu_tuc_hanh_chinh_linh_vuc: {
                    where: {
                        linh_vuc: {
                            is_delete: false,
                            is_active: true
                        },
                    },
                    include: {
                        linh_vuc: true,
                    },
                },
                truong_hop_thu_tuc: {
                    where: {
                        is_delete: false,
                        is_active: true,
                    },
                    include: {
                        thanh_phan_ho_so: {
                            where: { is_delete: false, is_active: true },
                        },
                    },
                },
            },
        });
    },

    async getAll(page, size, isActive, idLinhVuc, search) {
        const skip = (page - 1) * size;

        const where = {
            ...(isActive !== undefined && isActive !== ''
                ? { is_active: isActive === 'true' }
                : {}),

            ...(search
                ? {
                    OR: [
                        { ten_thu_tuc: { contains: search, mode: 'insensitive' } },
                        { ma_thu_tuc: { contains: search, mode: 'insensitive' } },
                    ],
                }
                : {}),

            ...(idLinhVuc
                ? {
                    thu_tuc_hanh_chinh_linh_vuc: {
                        some: { id_linh_vuc: idLinhVuc },
                    },
                }
                : {}),
            is_delete: false,
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
                is_active: true,
                is_delete: false,
            }
        });
        return count > 0;
    },

    async findByMaAndTenThuTuc(maThuTuc, tenThuTuc) {
        const whereCondition = {
            is_delete: false,
            ...(maThuTuc && maThuTuc !== '' ? { OR: [{ ten_thu_tuc: tenThuTuc }, { ma_thu_tuc: maThuTuc }] } : { ten_thu_tuc: tenThuTuc }),
        };
        return await prisma.thu_tuc_hanh_chinh.findFirst({
            where: whereCondition
        });
    },

    async createThuTuc(id_co_so_dich_vu_cong, ten_thu_tuc, ma_thu_tuc, doi_tuong_thuc_hien, yeu_cau_dieu_kien_chung, so_quyet_dinh, danh_sach_linh_vuc_ids, danh_sach_mau_don, cach_thu_thuc_hien, trinh_tu_thuc_hien, truongHopThuTuc = [], currentUser) {
        return await prisma.$transaction(async (tx) => {
            const newThuTuc = await tx.thu_tuc_hanh_chinh.create({
                data: {
                    id_co_so_dich_vu_cong,
                    ten_thu_tuc,
                    ma_thu_tuc,
                    doi_tuong_thuc_hien,
                    yeu_cau_dieu_kien_chung,
                    so_quyet_dinh,
                    thoi_gian_tao: new Date().toISOString(),
                    nguoi_tao: currentUser,
                },
            });

            await handleLinhVucUpdate(tx, newThuTuc.id, danh_sach_linh_vuc_ids, currentUser);
            await handleMauDonUpdate(tx, newThuTuc.id, danh_sach_mau_don, currentUser);
            await handleCachThucThucHienUdpate(tx, newThuTuc.id, cach_thu_thuc_hien, currentUser);
            await handleTruongHopUpdate(tx, newThuTuc.id, truongHopThuTuc, currentUser);
            await handleTrinhTuThucHienUpdate(tx, newThuTuc.id, trinh_tu_thuc_hien, currentUser);

            return await tx.thu_tuc_hanh_chinh.findUnique({
                where: { id: newThuTuc.id },
                include: {
                    thu_tuc_hanh_chinh_linh_vuc: true,
                    thu_tuc_hanh_chinh_mau_don: true,
                    cach_thuc_thuc_hien: true,
                    trinh_tu_thuc_hien_thu_tuc: {
                        orderBy: { thu_tu_buoc: 'asc' }
                    },
                    truong_hop_thu_tuc: {
                        where: { is_delete: false, is_active: true },
                        include: {
                            thanh_phan_ho_so: { where: { is_delete: false, is_active: true } }
                        }
                    },
                }
            });
        });
    },

    async deleteThuTuc(thuTucId, currentUser, tenThuTuc, maThuTuc) {
        await prisma.$transaction(async (tx) => {
            await tx.thu_tuc_hanh_chinh_linh_vuc.deleteMany({
                where: { id_thu_tuc_hanh_chinh: thuTucId },
            });
            await tx.thu_tuc_hanh_chinh_mau_don.deleteMany({
                where: { id_thu_tuc: thuTucId },
            });
            await tx.cach_thuc_thuc_hien.updateMany({
                where: { id_thu_tuc: thuTucId },
                data: {
                    is_active: false,
                    is_delete: true,
                    nguoi_cap_nhat: currentUser,
                    thoi_gian_cap_nhat: new Date().toISOString(),
                }
            });
            await tx.trinh_tu_thuc_hien_thu_tuc.updateMany({
                where: { id_thu_tuc: thuTucId },
                data: {
                    is_active: false,
                    is_delete: true,
                    nguoi_cap_nhat: currentUser,
                    thoi_gian_cap_nhat: new Date().toISOString(),
                }
            });
            await tx.thu_tuc_hanh_chinh.update({
                where: { id: thuTucId },
                data: {
                    is_delete: true,
                    nguoi_cap_nhat: currentUser,
                    thoi_gian_cap_nhat: new Date().toISOString(),
                    ten_thu_tuc: tenThuTuc,
                    ma_thu_tuc: maThuTuc,
                },
            });
        });
    },

    async findByMaOrTenExcludeId(maThuTuc, tenThuTuc, excludeId) {
        const whereCondition = {
            is_delete: false,
            id: { not: excludeId },
            ...(maThuTuc && maThuTuc !== '' ? { OR: [{ ten_thu_tuc: tenThuTuc }, { ma_thu_tuc: maThuTuc }] } : { ten_thu_tuc: tenThuTuc }),
        };
        return await prisma.thu_tuc_hanh_chinh.findFirst({
            where: whereCondition
        });
    },

    async updateThuTuc(thuTucId, id_co_so_dich_vu_cong, ten_thu_tuc, ma_thu_tuc, doi_tuong_thuc_hien, yeu_cau_dieu_kien_chung, so_quyet_dinh, danh_sach_linh_vuc_ids, danh_sach_mau_don, cach_thu_thuc_hien, trinh_tu_thuc_hien, truongHopThuTuc = [], currentUser) {
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
                    thoi_gian_cap_nhat: new Date().toISOString(),
                    nguoi_cap_nhat: currentUser,
                },
            });

            await handleCachThucThucHienUdpate(tx, thuTucId, cach_thu_thuc_hien, currentUser);
            await handleTruongHopUpdate(tx, thuTucId, truongHopThuTuc, currentUser);
            await handleTrinhTuThucHienUpdate(tx, thuTucId, trinh_tu_thuc_hien, currentUser);
            await handleLinhVucUpdate(tx, thuTucId, danh_sach_linh_vuc_ids, currentUser);
            await handleMauDonUpdate(tx, thuTucId, danh_sach_mau_don, currentUser);

            return await tx.thu_tuc_hanh_chinh.findUnique({
                where: { id: updatedThuTuc.id },
                include: {
                    thu_tuc_hanh_chinh_linh_vuc: true,
                    thu_tuc_hanh_chinh_mau_don: true,
                    cach_thuc_thuc_hien: true,
                    trinh_tu_thuc_hien_thu_tuc: {
                        orderBy: { thu_tu_buoc: 'asc' }
                    },
                    truong_hop_thu_tuc: {
                        where: { is_delete: false, is_active: true },
                        include: {
                            thanh_phan_ho_so: { where: { is_delete: false, is_active: true } }
                        }
                    },
                }
            });
        });
    },

    async getMauDonByThuTucId(thuTucId) {
        const list = await prisma.thu_tuc_hanh_chinh_mau_don.findMany({
            where: {
                id_thu_tuc: thuTucId,
                mau_don: {
                    is_active: true,
                    is_delete: false
                },
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
            is_active: true,
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
                id: thuTucId,
                is_delete: false,
            },
        });
    },

    async findByCoSoDichVuCongId(id_co_so_dich_vu_cong) {
        return await prisma.thu_tuc_hanh_chinh.findMany({
            where: {
                id_co_so_dich_vu_cong,
                is_active: true,
                is_delete: false,
            },
        });
    },

    async updateThuTucStatus(thuTucId, isActive, currentUser) {
        return await prisma.thu_tuc_hanh_chinh.update({
            where: { id: thuTucId },
            data: {
                is_active: isActive,
                thoi_gian_cap_nhat: new Date().toISOString(),
                nguoi_cap_nhat: currentUser,
            },
        });
    },

    async getThanhPhanByThuTucId(thuTucId) {
        const truongHops = await prisma.truong_hop_thu_tuc.findMany({
            where: { id_thu_tuc: thuTucId, is_active: true, is_delete: false },
            include: {
                thanh_phan_ho_so: {
                    where: { is_active: true, is_delete: false },
                },
            },
        });
        return truongHops;
    }
};

export default ThuTucRepository;