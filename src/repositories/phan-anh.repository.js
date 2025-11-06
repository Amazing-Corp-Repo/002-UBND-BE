import prisma from '../config/database.config.js';

const PhanAnhRepository = {
    async create(data) {
        return await prisma.phan_anh.create({
            data: data,
        });
    },

    async findByMaPhanAnh(maPhanAnh) {
        return await prisma.phan_anh.findFirst({
            where: {
                ma_phan_anh: maPhanAnh,
            },
        });
    },

    async createLichSuTrangThaiPhanAnh(data) {
        return await prisma.lich_su_trang_thai.create({
            data: data,
        });
    },

    async addFileToPhanAnh(data) {
        return await prisma.dinh_kem_phan_anh.createMany({
            data: data,
        });
    },

    async getPhanAnhByMaPhanAnh(maPhanAnh) {
        return await prisma.phan_anh.findFirst({
            where: {
                ma_phan_anh: maPhanAnh,
            },
            include: {
                lich_su_trang_thai: {
                    orderBy: {
                        thoi_gian_tao: 'desc',
                    },
                    select: {
                        ten: true,
                        thoi_gian_tao: true,
                    },
                },
                dinh_kem_phan_anh: {
                    select: {
                        dinh_dang_file: true,
                        url_file: true,
                        kich_thuoc_file_mb: true,
                    }
                },
                linh_vuc_phan_anh: {
                    select: {
                        ten: true,
                    },
                },
            },
        });
    },

    async getAll(idLinhVucPhanAnh, trangThai, mucDo, maPhanAnh, page, size) {
        const whereClause = {};
        if (idLinhVucPhanAnh) {
            whereClause.id_linh_vuc_phan_anh = idLinhVucPhanAnh;
        }
        if (mucDo) {
            whereClause.muc_do = mucDo;
        }
        if (trangThai) {
            whereClause.lich_su_trang_thai = {
                some: {
                    ten: trangThai,
                },
            };
        }
        if (maPhanAnh) {
            whereClause.ma_phan_anh = maPhanAnh;
        }
        const [phanAnhs, total] = await Promise.all([
            await prisma.phan_anh.findMany({
                where: whereClause,
                skip: (page - 1) * size,
                take: size,
                orderBy: {
                    thoi_gian_tao: 'desc',
                },
                include: {
                    lich_su_trang_thai: {
                        orderBy: {
                            thoi_gian_tao: 'desc',
                        },
                        select: {
                            ten: true,
                            thoi_gian_tao: true,
                        },
                    },
                    dinh_kem_phan_anh: {
                        select: {
                            dinh_dang_file: true,
                            url_file: true,
                            kich_thuoc_file_mb: true,
                        }
                    },
                    linh_vuc_phan_anh: {
                        select: {
                            ten: true,
                        },
                    },
                },
            }),
            await prisma.phan_anh.count({
                where: whereClause,
            }),
        ])
        return { data: phanAnhs, totalItems: total };
    },

    async getLichSuTrangThaiPhanAnh(idPhanAnh) {
        return await prisma.lich_su_trang_thai.findMany({
            where: {
                id_phan_anh: idPhanAnh,
            },
            orderBy: {
                thoi_gian_tao: 'desc',
            },
        });
    },

    async getPhanAnhByUserId(userId) {
        return await prisma.phan_anh.findMany({
            where: {
                nguoi_tao: userId,
            },
            orderBy: {
                thoi_gian_tao: 'desc',
            },
            include: {
                lich_su_trang_thai: {
                    orderBy: {
                        thoi_gian_tao: 'desc',
                    },
                    select: {
                        ten: true,
                        thoi_gian_tao: true,
                    },
                },
                dinh_kem_phan_anh: {
                    select: {
                        dinh_dang_file: true,
                        url_file: true,
                        kich_thuoc_file_mb: true,
                    }
                },
                linh_vuc_phan_anh: {
                    select: {
                        ten: true,
                    },
                },
            },
        });
    },

    async getById(idPhanAnh) {
        return await prisma.phan_anh.findUnique({
            where: {
                id: idPhanAnh,
            },
            include: {
                lich_su_trang_thai: {
                    orderBy: {
                        thoi_gian_tao: 'desc',
                    },
                },
                dinh_kem_phan_anh: true,
                linh_vuc_phan_anh: true,
            },
        });
    },

    async updateStatusWithHistory(idPhanAnh, phanAnhPatch, historyData) {
        return await prisma.$transaction(async (tx) => {
            // Cập nhật bảng phản ánh
            await tx.phan_anh.update({
                where: { id: idPhanAnh },
                data: {
                    thoi_gian_tiep_nhan: phanAnhPatch.thoi_gian_tiep_nhan,
                    thoi_gian_phan_hoi_du_kien: phanAnhPatch.thoi_gian_phan_hoi_du_kien,
                    ngay_du_kien_hoan_thanh: phanAnhPatch.ngay_du_kien_hoan_thanh,
                    nguoi_cap_nhat: phanAnhPatch.nguoi_cap_nhat,
                    thoi_gian_cap_nhat: new Date(),
                },
            });

            // Tạo bản ghi lịch sử trạng thái
            await tx.lich_su_trang_thai.create({
                data: {
                    id_phan_anh: idPhanAnh,
                    ten: historyData.ten,
                    ghi_chu: historyData.ghi_chu || null,
                    nguoi_tao: historyData.nguoi_tao || null,
                },
            });
        });
    }
};

export default PhanAnhRepository;