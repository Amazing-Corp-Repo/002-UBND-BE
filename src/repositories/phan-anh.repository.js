import prisma from "../config/database.config.js";
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
            thoi_gian_tao: "desc",
          },
          select: {
            ten: true,
            thoi_gian_tao: true,
          },
        },
        dinh_kem_phan_anh: {
          select: {
            id: true,
            dinh_dang_file: true,
            url_file: true,
            kich_thuoc_file_mb: true,
            loai: true,
          },
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

  async getAll(
    idLinhVucPhanAnh,
    trangThai,
    mucDo,
    maPhanAnh,
    page,
    size,
    sortTime,
  ) {
    const skip = (page - 1) * size;

    const orderDirection = sortTime === "asc" ? "asc" : "desc";

    const params = [];
    let whereSql = `WHERE 1=1 AND (pa.is_approve = true OR pa.is_approve IS NULL)`;

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
    const rows = await prisma.$queryRawUnsafe(
      `
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
    `,
      ...params,
    );

    const ids = rows.map((r) => r.id);

    if (ids.length === 0) {
      return { data: [], totalItems: 0 };
    }

    // Count tổng
    const total = await prisma.$queryRawUnsafe(
      `
        SELECT COUNT(*)::int AS count
        FROM phan_anh pa
        JOIN (
            SELECT DISTINCT ON (id_phan_anh)
                id_phan_anh, ten, thoi_gian_tao
            FROM lich_su_trang_thai
            ORDER BY id_phan_anh, thoi_gian_tao DESC
        ) lst ON lst.id_phan_anh = pa.id
        ${whereSql};
    `,
      ...params.slice(0, params.length - 2),
    );

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
          },
        },
        linh_vuc_phan_anh: {
          select: {
            ten: true,
          },
        },
      },
    });

    return {
      data: phanAnhs,
      totalItems: total[0].count,
    };
  },

  async getLichSuTrangThaiPhanAnh(idPhanAnh) {
    return await prisma.lich_su_trang_thai.findMany({
      where: {
        id_phan_anh: idPhanAnh,
      },
      orderBy: {
        thoi_gian_tao: "desc",
      },
    });
  },

  async getPhanAnhByUserId(userId, sortTime) {
    const orderBy = {
      thoi_gian_tao: sortTime === "asc" ? "asc" : "desc",
    };
    const phanAnhs = await prisma.phan_anh.findMany({
      where: {
        nguoi_tao: userId,
      },
      orderBy,
      include: {
        lich_su_trang_thai: {
          orderBy: {
            thoi_gian_tao: "desc",
          },
          select: {
            ten: true,
            thoi_gian_tao: true,
          },
        },
        dinh_kem_phan_anh: {
          select: {
            id: true,
            dinh_dang_file: true,
            url_file: true,
            kich_thuoc_file_mb: true,
            loai: true,
          },
        },
        linh_vuc_phan_anh: {
          select: {
            ten: true,
          },
        },
      },
    });

    const allVideoIds = phanAnhs.flatMap((p) =>
      Array.isArray(p.id_video) ? p.id_video : [],
    );
    let videosMap = new Map();
    if (allVideoIds.length > 0) {
      const videos = await prisma.video_uploads.findMany({
        where: { id: { in: allVideoIds } },
        select: {
          id: true,
          status: true,
          final_hls_url: true,
          created_at: true,
          updated_at: true,
        },
      });
      videosMap = new Map(videos.map((v) => [v.id, v]));
    }

    return phanAnhs.map((p) => {
      if (Array.isArray(p.id_video) && p.id_video.length > 0) {
        const vids = p.id_video.map((id) => videosMap.get(id)).filter(Boolean);
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
            thoi_gian_tao: "desc",
          },
          include: {
            nguoi_dung: {
              select: {
                ten_dang_nhap: true,
              },
            },
          },
        },
        dinh_kem_phan_anh: {
          select: {
            id: true,
            dinh_dang_file: true,
            url_file: true,
            kich_thuoc_file_mb: true,
            loai: true,
          },
        },
        linh_vuc_phan_anh: {
          select: {
            ten: true,
            mo_ta: true,
          },
        },
      },
    });

    if (!phanAnh) return phanAnh;

    if (Array.isArray(phanAnh.id_video) && phanAnh.id_video.length > 0) {
      const videos = await prisma.video_uploads.findMany({
        where: { id: { in: phanAnh.id_video } },
        select: {
          id: true,
          status: true,
          final_hls_url: true,
        },
      });
      return { ...phanAnh, videos };
    }

    return phanAnh;
  },

  async updateStatusWithHistory(
    idPhanAnh,
    phanAnhPatch,
    historyData,
    dinhKems = [],
  ) {
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

      // Lưu ảnh hiện trường (đính kèm loại GIAI_QUYET) nếu có
      if (dinhKems.length > 0) {
        await tx.dinh_kem_phan_anh.createMany({
          data: dinhKems.map((d) => ({ ...d, id_phan_anh: idPhanAnh })),
        });
      }
    });
  },

  async getTongQuanPhanAnh() {
    const now = new Date();

    const startOfTodayUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );

    const endOfTodayUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    // Tổng số trạng thái tạo hôm nay theo UTC
    const tongHomNay = await prisma.phan_anh.count({
      where: {
        thoi_gian_tao: {
          gte: startOfTodayUTC,
          lte: endOfTodayUTC,
        },
      },
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
    rows.forEach((r) => {
      thongKeTheoTrangThai[r.ten] = Number(r.count) || 0;
    });

    // đảm bảo đủ tất cả trạng thái
    Object.values(PHAN_ANH_STATUS).forEach((status) => {
      if (!thongKeTheoTrangThai[status]) {
        thongKeTheoTrangThai[status] = 0;
      }
    });

    let nhat_ky_hoat_dong = await prisma.audit_logs.findMany({
      select: {
        table_name: true,
        nguoi_dung: {
          select: {
            id: true,
            ho_va_ten: true,
            email: true,
          },
        },
        response_status_code: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 5,
    });

    return {
      tong_hom_nay: tongHomNay,
      thong_ke_theo_trang_thai: thongKeTheoTrangThai,
      nhat_ky_hoat_dong,
    };
  },

  async searhByTieuDe(search) {
    return await prisma.phan_anh.findMany({
      where: {
        OR: [
          {
            tieu_de: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            ma_phan_anh: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        ma_phan_anh: true,
        tieu_de: true,
        mo_ta: true,
        linh_vuc_phan_anh: {
          select: {
            ten: true,
          },
        },
        thoi_gian_tao: true,
        lich_su_trang_thai: {
          orderBy: {
            thoi_gian_tao: "desc",
          },
          select: {
            ten: true,
            thoi_gian_tao: true,
          },
          take: 1,
        },
      },
      take: 1000,
    });
  },

  async getAllByCate(
    cateList,
    idLinhVucPhanAnh,
    trangThai,
    mucDo,
    maPhanAnh,
    page,
    size,
    sortTime,
  ) {
    const skip = (page - 1) * size;
    const orderDirection = sortTime === "asc" ? "asc" : "desc";

    const params = [];
    let whereSql = `WHERE 1=1`;

    if (idLinhVucPhanAnh) {
      params.push(idLinhVucPhanAnh);
      whereSql += ` AND pa.id_linh_vuc_phan_anh = $${params.length}::uuid`;
    } else if (cateList && cateList.length > 0) {
      params.push(cateList);
      whereSql += ` AND pa.id_linh_vuc_phan_anh = ANY($${params.length}::uuid[])`;
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

    params.push(size);
    params.push(skip);

    const rows = await prisma.$queryRawUnsafe(
      `
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
    `,
      ...params,
    );

    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return { data: [], totalItems: 0 };

    const total = await prisma.$queryRawUnsafe(
      `
      SELECT COUNT(*)::int AS count
      FROM phan_anh pa
      JOIN (
          SELECT DISTINCT ON (id_phan_anh)
              id_phan_anh, ten, thoi_gian_tao
          FROM lich_su_trang_thai
          ORDER BY id_phan_anh, thoi_gian_tao DESC
      ) lst ON lst.id_phan_anh = pa.id
      ${whereSql};
    `,
      ...params.slice(0, params.length - 2),
    );

    const phanAnhs = await prisma.phan_anh.findMany({
      where: { id: { in: ids } },
      orderBy: { thoi_gian_tao: orderDirection },
      include: {
        lich_su_trang_thai: {
          orderBy: { thoi_gian_tao: "desc" },
          select: { ten: true, thoi_gian_tao: true },
        },
        linh_vuc_phan_anh: { select: { ten: true } },
      },
    });

    return { data: phanAnhs, totalItems: total[0].count };
  },

  async getPhanAnhToDowload(from, to) {
    let whereClause = {
      thoi_gian_tao: {
        gte: from,
        lte: to,
      },
    };

    let data = await prisma.phan_anh.findMany({
      where: whereClause,
      select: {
        id: true,
        tieu_de: true,
        ma_phan_anh: true,
        muc_do: true,
        ten_nguoi_phan_anh: true,
        sdt_nguoi_phan_anh: true,
        mo_ta: true,
        vi_tri: true,
        thoi_gian_tiep_nhan: true,
        thoi_gian_tao: true,
        id_video: true,
        dinh_kem_phan_anh: {
          select: {
            id: true,
            dinh_dang_file: true,
            url_file: true,
            loai: true,
          },
        },
        linh_vuc_phan_anh: {
          select: {
            ten: true,
          },
        },
        lich_su_trang_thai: {
          orderBy: {
            thoi_gian_tao: "desc",
          },
          select: {
            ten: true,
            thoi_gian_tao: true,
            ghi_chu: true,
            nguoi_tao: true,
          },
        },
      },
    });

    return data;
  },

  async getById(idPhanAnh) {
    return await prisma.phan_anh.findUnique({
      where: { id: idPhanAnh },
      include: {
        lich_su_trang_thai: {
          orderBy: { thoi_gian_tao: "desc" },
          // Kèm người thực hiện đổi trạng thái (để biết AI tiếp nhận/xử lý + lúc nào).
          include: {
            nguoi_dung: {
              select: { id: true, ho_va_ten: true, ten_dang_nhap: true },
            },
          },
        },
        dinh_kem_phan_anh: true,
        linh_vuc_phan_anh: true,
        to_phu_trach: {
          select: { id: true, ho_va_ten: true, email: true },
        },
      },
    });
  },

  async updatePhanAnh(idPhanAnh, data) {
    return await prisma.phan_anh.update({
      where: { id: idPhanAnh },
      data: data,
    });
  },

  async updateLinhVucWithHistory(idPhanAnh, patch, historyData) {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.phan_anh.update({
        where: { id: idPhanAnh },
        data: patch,
      });
      await tx.lich_su_trang_thai.create({
        data: {
          id_phan_anh: idPhanAnh,
          ten: historyData.ten,
          ghi_chu: historyData.ghi_chu,
          nguoi_tao: historyData.nguoi_tao,
        },
      });
      return updated;
    });
  },

  async getPendingApprovalPhanAnh(idTo, page, size, sortTime) {
    const skip = (page - 1) * size;
    const orderDirection = sortTime === "asc" ? "asc" : "desc";

    // Get feedback pending approval for this ward (is_approve = false and not null)
    const data = await prisma.phan_anh.findMany({
      where: {
        id_to: idTo,
        is_approve: false, // Chờ duyệt
      },
      orderBy: { thoi_gian_tao: orderDirection },
      skip,
      take: size,
      include: {
        lich_su_trang_thai: {
          orderBy: { thoi_gian_tao: "desc" },
          select: {
            ten: true,
            thoi_gian_tao: true,
          },
        },
        linh_vuc_phan_anh: {
          select: { ten: true },
        },
        dinh_kem_phan_anh: {
          select: {
            id: true,
            dinh_dang_file: true,
            url_file: true,
            kich_thuoc_file_mb: true,
            loai: true,
          },
        },
      },
    });

    const totalItems = await prisma.phan_anh.count({
      where: {
        id_to: idTo,
        is_approve: false,
      },
    });

    return { data, totalItems };
  },
};

export default PhanAnhRepository;
