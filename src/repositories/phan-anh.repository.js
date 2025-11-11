import prisma from '../config/database.config.js';
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";

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
        const skip = (page - 1) * size;

        const orderDirection = sortTime === "asc" ? "asc" : "desc";

        const params = [];
        let whereSql = `WHERE 1=1`;

        if (idLinhVucPhanAnh) {
            params.push(idLinhVucPhanAnh);
            whereSql += ` AND pa.id_linh_vuc_phan_anh = $${params.length}::uuid`;
        }

        if (mucDo) {
            params.push(mucDo);
            whereSql += ` AND pa.muc_do = $${params.length}`;
        }

        if (maPhanAnh) {
            params.push(maPhanAnh);
            whereSql += ` AND pa.ma_phan_anh = $${params.length}`;
        }

        if (trangThai) {
            params.push(trangThai);
            whereSql += ` AND lst.ten = $${params.length}`;
        }

        // paging params
        params.push(size);
        params.push(skip);

        // Query lấy danh sách phản ánh + trạng thái mới nhất
        const rows = await prisma.$queryRawUnsafe(`
        SELECT pa.id
        FROM phan_anh pa
        JOIN (
            SELECT DISTINCT ON (id_phan_anh)
                id_phan_anh, ten, thoi_gian_tao
            FROM lich_su_trang_thai
            ORDER BY id_phan_anh, thoi_gian_tao DESC
        ) lst ON lst.id_phan_anh = pa.id
        ${whereSql}
        ORDER BY pa.thoi_gian_tao ${orderDirection}
        LIMIT $${params.length - 1} OFFSET $${params.length};
    `, ...params);

        const ids = rows.map(r => r.id);

        if (ids.length === 0) {
            return { data: [], totalItems: 0 };
        }

        // Count tổng
        const total = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int AS count
        FROM phan_anh pa
        JOIN (
            SELECT DISTINCT ON (id_phan_anh)
                id_phan_anh, ten, thoi_gian_tao
            FROM lich_su_trang_thai
            ORDER BY id_phan_anh, thoi_gian_tao DESC
        ) lst ON lst.id_phan_anh = pa.id
        ${whereSql};
    `, ...(params.slice(0, params.length - 2)));

        // Fetch dữ liệu full bằng Prisma (include đầy đủ)
        const phanAnhs = await prisma.phan_anh.findMany({
            where: { id: { in: ids } },
            orderBy: { thoi_gian_tao: orderDirection },
            include: {
                lich_su_trang_thai: {
                    orderBy: { thoi_gian_tao: "desc" },
                    select: {
                        ten: true,
                        thoi_gian_tao: true,
                    }
                },
                linh_vuc_phan_anh: {
                    select: {
                        ten: true,
                    }
                }
            }
        });

        return {
            data: phanAnhs,
            totalItems: total[0].count
        };
    }
    ,

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
    },

    async getTongQuanPhanAnh() {
        const now = new Date();

        const startOfTodayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            0, 0, 0, 0
        ));

        const endOfTodayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23, 59, 59, 999
        ));

        // Tổng số trạng thái tạo hôm nay theo UTC
        const tongHomNay = await prisma.phan_anh.count({
            where: {
                thoi_gian_tao: {
                    gte: startOfTodayUTC,
                    lte: endOfTodayUTC
                }
            }
        });

        const rows = await prisma.$queryRawUnsafe(`
            WITH latest_status AS (
                SELECT
                    ls.id_phan_anh,
                    ls.ten,
                    ls.thoi_gian_tao,
                    ROW_NUMBER() OVER (
                        PARTITION BY ls.id_phan_anh
                        ORDER BY ls.thoi_gian_tao DESC
                    ) AS rn
                FROM lich_su_trang_thai ls
            )
            SELECT ten, COUNT(*)::int AS count
            FROM latest_status
            WHERE rn = 1
            GROUP BY ten;
        `);

        const thongKeTheoTrangThai = {};
        rows.forEach(r => {
            thongKeTheoTrangThai[r.ten] = Number(r.count) || 0;
        });

        // đảm bảo đủ tất cả trạng thái
        Object.values(PHAN_ANH_STATUS).forEach(status => {
            if (!thongKeTheoTrangThai[status]) {
                thongKeTheoTrangThai[status] = 0;
            }
        });

        const startDateUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() - 6, // 6 ngày trước + hôm nay = 7 ngày
            0, 0, 0, 0
        ));

        const endDateUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            23, 59, 59, 999
        ));

        const xuHuong = await prisma.$queryRaw`
        WITH pa_day AS (
            SELECT
                DATE(thoi_gian_tao) AS day,
                COUNT(*) AS tong
            FROM phan_anh
            WHERE thoi_gian_tao >= ${startDateUTC}
              AND thoi_gian_tao <= ${endDateUTC}
            GROUP BY DATE(thoi_gian_tao)
        ),
        latest_status AS (
            SELECT
                ls.id_phan_anh,
                ls.ten,
                ls.thoi_gian_tao,
                ROW_NUMBER() OVER (
                    PARTITION BY ls.id_phan_anh
                    ORDER BY ls.thoi_gian_tao DESC
                ) AS rn
            FROM lich_su_trang_thai ls
            WHERE ls.thoi_gian_tao >= ${startDateUTC}
              AND ls.thoi_gian_tao <= ${endDateUTC}
        ),
        da_giai_quyet_day AS (
            SELECT
                DATE(thoi_gian_tao) AS day,
                COUNT(*) AS da_giai_quyet
            FROM latest_status
            WHERE rn = 1 AND ten = 'Đã giải quyết'
            GROUP BY DATE(thoi_gian_tao)
        )
        SELECT 
            d.day,
            COALESCE(p.tong, 0) AS tong_phan_anh,
            COALESCE(g.da_giai_quyet, 0) AS da_giai_quyet
        FROM generate_series(
            ${startDateUTC}::date,
            ${endDateUTC}::date,
            INTERVAL '1 day'
        ) AS d(day)
        LEFT JOIN pa_day p ON p.day = d.day
        LEFT JOIN da_giai_quyet_day g ON g.day = d.day
        ORDER BY d.day;
    `;

        const xuHuongPhanAnh = xuHuong.map(r => ({
            date: r.day,
            tong_phan_anh: Number(r.tong_phan_anh),
            da_giai_quyet: Number(r.da_giai_quyet),
        }));

        return {
            tong_hom_nay: tongHomNay,
            thong_ke_theo_trang_thai: thongKeTheoTrangThai,
            xu_huong_phan_anh: xuHuongPhanAnh,
        };
    }
};

export default PhanAnhRepository;