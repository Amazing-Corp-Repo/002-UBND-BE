import prisma from "../config/database.config.js";

const ReportRepository = {
  async getReportPhanAnh(from, to, idLinhVuc) {
    let whereClause = {
      ...(idLinhVuc && { id_linh_vuc_phan_anh: idLinhVuc }),
    };
    let whereClauseNotIncludeLinhVuc = {};
    if (from && to) {
      whereClause.thoi_gian_tao = {
        gte: from,
        lte: to,
      };
      whereClauseNotIncludeLinhVuc.thoi_gian_tao = {
        gte: from,
        lte: to,
      };
    }

    let phanAnh = await prisma.phan_anh.findMany({
      where: whereClause,
      select: {
        id: true,
        linh_vuc_phan_anh: {
          select: {
            id: true,
            ten: true,
          },
        },
        thoi_gian_tao: true,
        lich_su_trang_thai: {
          orderBy: {
            thoi_gian_tao: "desc",
          },
          take: 1,
          select: {
            ten: true,
          },
        },
      },
    });

    let phanAnhMoiCapNhat = await prisma.phan_anh.findMany({
      select: {
        ma_phan_anh: true,
        tieu_de: true,
        linh_vuc_phan_anh: {
          select: {
            ten: true,
          },
        },
        lich_su_trang_thai: {
          orderBy: {
            thoi_gian_tao: "desc",
          },
          take: 1,
          select: {
            ten: true,
            thoi_gian_tao: true,
          },
        },
        thoi_gian_cap_nhat: true,
      },
      orderBy: {
        thoi_gian_cap_nhat: "desc",
      },
      take: 5,
    });

    let linh_vuc = await prisma.linh_vuc_phan_anh.findMany({
      where: {
        is_active: true,
        is_delete: false,
      },
      select: {
        id: true,
        ten: true,
        phan_anh: {
          select: {
            id: true,
            lich_su_trang_thai: {
              orderBy: {
                thoi_gian_tao: "desc",
              },
              select: {
                ten: true,
                thoi_gian_tao: true,
              },
            },
          },
        },
      },
    });

    let totalPhanAnh = await prisma.phan_anh.count({
      where: whereClauseNotIncludeLinhVuc,
    });

    return { phanAnh, phanAnhMoiCapNhat, linh_vuc, totalPhanAnh };
  },

  async getPhanAnhTheoThang(from, to, idLinhVuc) {
    const where = {
      ...(idLinhVuc && { id_linh_vuc_phan_anh: idLinhVuc }),
      ...(from && to && { thoi_gian_tao: { gte: from, lte: to } }),
    };
    return await prisma.phan_anh.findMany({
      where,
      select: {
        id: true,
        ma_phan_anh: true,
        tieu_de: true,
        muc_do: true,
        vi_tri: true,
        thoi_gian_tao: true,
        linh_vuc_phan_anh: { select: { id: true, ten: true } },
        lich_su_trang_thai: {
          orderBy: { thoi_gian_tao: "desc" },
          take: 1,
          select: { ten: true },
        },
      },
      orderBy: { thoi_gian_tao: "desc" },
    });
  },

  async getChiTietPhanAnh(from, to, idLinhVuc, trangThai, page, size) {
    const conditions = [];
    const params = [];
    let i = 1;

    if (from && to) {
      conditions.push(
        `pa.thoi_gian_tao >= $${i++}::timestamp AND pa.thoi_gian_tao <= $${i++}::timestamp`,
      );
      params.push(from, to);
    }
    if (idLinhVuc) {
      conditions.push(`pa.id_linh_vuc_phan_anh = $${i++}::uuid`);
      params.push(idLinhVuc);
    }
    if (trangThai) {
      conditions.push(`ls.ten = $${i++}`);
      params.push(trangThai);
    }

    const whereSql = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const baseFrom = `
      FROM phan_anh pa
      LEFT JOIN linh_vuc_phan_anh lv ON lv.id = pa.id_linh_vuc_phan_anh
      LEFT JOIN (
        SELECT id_phan_anh, ten,
          ROW_NUMBER() OVER (PARTITION BY id_phan_anh ORDER BY thoi_gian_tao DESC) AS rn
        FROM lich_su_trang_thai
      ) ls ON ls.id_phan_anh = pa.id AND ls.rn = 1
      ${whereSql}
    `;

    let dataSql = `
      SELECT pa.id, pa.ma_phan_anh, pa.tieu_de, pa.thoi_gian_cap_nhat,
             lv.ten AS linh_vuc, ls.ten AS trang_thai_hien_tai
      ${baseFrom}
      ORDER BY pa.thoi_gian_cap_nhat DESC NULLS LAST
    `;
    const dataParams = [...params];
    if (size) {
      dataSql += ` LIMIT $${i++} OFFSET $${i++}`;
      dataParams.push(size, (page - 1) * size);
    }

    const countSql = `SELECT COUNT(*)::int AS total ${baseFrom}`;

    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe(dataSql, ...dataParams),
      prisma.$queryRawUnsafe(countSql, ...params),
    ]);

    return { data: rows, totalItems: countRows[0]?.total || 0 };
  },

  async getReportThuTuc(from, to) {
    let whereClause = {};
    if (from && to) {
      whereClause.thoi_gian_tao = {
        gte: from,
        lte: to,
      };
    }

    let linhVuc = await prisma.thu_tuc_hanh_chinh.findMany({
      where: {
        ...whereClause,
        is_active: true,
        is_delete: false,
      },
      select: {
        thu_tuc_hanh_chinh_linh_vuc: {
          select: {
            linh_vuc: {
              select: {
                id: true,
                ten_linh_vuc: true,
              },
            },
          },
        },
        id: true,
      },
    });

    const [totalThuTuc, totalThuTucCoMauDon] = await Promise.all([
      prisma.thu_tuc_hanh_chinh.count({
        where: {
          is_delete: false,
          is_active: true,
        },
      }),
      prisma.thu_tuc_hanh_chinh.count({
        where: {
          thu_tuc_hanh_chinh_mau_don: {
            some: {},
          },
          is_delete: false,
          is_active: true,
        },
      }),
    ]);

    return { linhVuc, totalThuTuc, totalThuTucCoMauDon };
  },

  async getReportTinTuc(from, to) {
    let whereClause = {};
    if (from && to) {
      whereClause.thoi_gian_tao = {
        gte: from,
        lte: to,
      };
    }

    let data = await prisma.tin_tuc.findMany({
      where: {
        ...whereClause,
        is_delete: false,
      },
      select: {
        id: true,
        thoi_gian_tao: true,
        _count: { select: { tin_tuc_view: true } },
        is_active: true,
      },
      orderBy: { thoi_gian_tao: "asc" },
    });

    return { tinTucLists: data };
  },
};

export default ReportRepository;
