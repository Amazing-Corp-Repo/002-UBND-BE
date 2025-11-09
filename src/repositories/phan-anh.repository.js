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
        const phanAnh = await prisma.phan_anh.findFirst({
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

        if (!phanAnh) return phanAnh;

        // attach video metadata if present (id_video is an array of upload ids)
        if (Array.isArray(phanAnh.id_video) && phanAnh.id_video.length > 0) {
            const videos = await prisma.video_uploads.findMany({
                where: { id: { in: phanAnh.id_video } },
                select: {
                    id: true,
                    status: true,
                    final_mp4_url: true,
                    final_hls_url: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            return { ...phanAnh, videos };
        }

        return phanAnh;
    },

    async getAll(idLinhVucPhanAnh, trangThai, mucDo, maPhanAnh, page, size, sortTime) {
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

        const orderBy = {
            thoi_gian_tao: sortTime === "asc" ? "asc" : "desc"
        };

        const [phanAnhs, total] = await Promise.all([
            await prisma.phan_anh.findMany({
                where: whereClause,
                skip: (page - 1) * size,
                take: size,
                orderBy,
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
        ]);

        // Batch fetch videos for results to avoid N+1 queries
        const allVideoIds = phanAnhs.flatMap(p => Array.isArray(p.id_video) ? p.id_video : []);
        let videosMap = new Map();
        if (allVideoIds.length > 0) {
            const videos = await prisma.video_uploads.findMany({
                where: { id: { in: allVideoIds } },
                select: {
                    id: true,
                    status: true,
                    final_mp4_url: true,
                    final_hls_url: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            videosMap = new Map(videos.map(v => [v.id, v]));
        }

        const dataWithVideos = phanAnhs.map(p => {
            if (Array.isArray(p.id_video) && p.id_video.length > 0) {
                const vids = p.id_video.map(id => videosMap.get(id)).filter(Boolean);
                return { ...p, videos: vids };
            }
            return p;
        });

        return { data: dataWithVideos, totalItems: total };
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

    async getPhanAnhByUserId(userId, sortTime) {
        const orderBy = {
            thoi_gian_tao: sortTime === "asc" ? "asc" : "desc"
        };
        const phanAnhs = await prisma.phan_anh.findMany({
            where: {
                nguoi_tao: userId,
            },
            orderBy,
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

        const allVideoIds = phanAnhs.flatMap(p => Array.isArray(p.id_video) ? p.id_video : []);
        let videosMap = new Map();
        if (allVideoIds.length > 0) {
            const videos = await prisma.video_uploads.findMany({
                where: { id: { in: allVideoIds } },
                select: {
                    id: true,
                    status: true,
                    final_mp4_url: true,
                    final_hls_url: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            videosMap = new Map(videos.map(v => [v.id, v]));
        }

        return phanAnhs.map(p => {
            if (Array.isArray(p.id_video) && p.id_video.length > 0) {
                const vids = p.id_video.map(id => videosMap.get(id)).filter(Boolean);
                return { ...p, videos: vids };
            }
            return p;
        });
    },

    async getById(idPhanAnh) {
        const phanAnh = await prisma.phan_anh.findUnique({
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

        if (!phanAnh) return phanAnh;

        if (Array.isArray(phanAnh.id_video) && phanAnh.id_video.length > 0) {
            const videos = await prisma.video_uploads.findMany({
                where: { id: { in: phanAnh.id_video } },
                select: {
                    id: true,
                    status: true,
                    final_mp4_url: true,
                    final_hls_url: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            return { ...phanAnh, videos };
        }

        return phanAnh;
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
                    thoi_gian_cap_nhat: new Date().toISOString(),
                },
            });

            // Tạo bản ghi lịch sử trạng thái
            await tx.lich_su_trang_thai.create({
                data: {
                    id_phan_anh: idPhanAnh,
                    ten: historyData.ten,
                    ghi_chu: historyData.ghi_chu,
                    nguoi_tao: historyData.nguoi_tao,
                },
            });
        });
    }
};

export default PhanAnhRepository;