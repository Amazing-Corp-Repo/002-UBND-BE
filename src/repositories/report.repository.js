import prisma from "../config/database.config.js";

const ReportRepository = {
  async getBaoCaoTongHop({ from, to }) {
    // Có truyền khoảng thời gian
    if (from && to) {
      const [result] = await prisma.$queryRaw`
            WITH filtered AS (
                SELECT *
                FROM view_bao_cao_tong_hop
                WHERE thoi_gian_tao BETWEEN ${from}::timestamp AND ${to}::timestamp
            ),
            summary AS (
                SELECT
                    COUNT(*) AS tong_phan_anh,
                    COUNT(*) FILTER (WHERE is_da_xu_ly = TRUE) AS da_xu_ly,
                    COUNT(*) FILTER (WHERE is_da_xu_ly = FALSE OR is_da_xu_ly IS NULL) AS chua_xu_ly,
                    AVG(gio_xu_ly) AS thoi_gian_xu_ly_tb
                FROM filtered
            ),
            top5_raw AS (
                SELECT ten_linh_vuc, COUNT(*) AS so_luong
                FROM filtered
                GROUP BY ten_linh_vuc
                ORDER BY so_luong DESC
                LIMIT 5
            ),
            top5 AS (
                SELECT json_agg(
                    json_build_object(
                        'ten_linh_vuc', ten_linh_vuc,
                        'so_luong', so_luong
                    )
                ) AS top_5_linh_vuc
                FROM top5_raw
            )
            SELECT summary.*, top5.top_5_linh_vuc
            FROM summary, top5;
        `;

      return result;
    }

    // Không truyền from/to -> lấy toàn bộ
    const [result] = await prisma.$queryRaw`
        WITH base AS (
            SELECT * FROM view_bao_cao_tong_hop
        ),
        summary AS (
            SELECT
                COUNT(*) AS tong_phan_anh,
                COUNT(*) FILTER (WHERE is_da_xu_ly = TRUE) AS da_xu_ly,
                COUNT(*) FILTER (WHERE is_da_xu_ly = FALSE OR is_da_xu_ly IS NULL) AS chua_xu_ly,
                AVG(gio_xu_ly) AS thoi_gian_xu_ly_tb
            FROM base
        ),
        top5_raw AS (
            SELECT ten_linh_vuc, COUNT(*) AS so_luong
            FROM base
            GROUP BY ten_linh_vuc
            ORDER BY so_luong DESC
            LIMIT 5
        ),
        top5 AS (
            SELECT json_agg(
                json_build_object(
                    'ten_linh_vuc', ten_linh_vuc,
                    'so_luong', so_luong
                )
            ) AS top_5_linh_vuc
            FROM top5_raw
        )
        SELECT summary.*, top5.top_5_linh_vuc
        FROM summary, top5;
    `;
    return result;
  },

  async getBaoCaoLinhVuc({ from, to }) {
    return await prisma.$queryRaw`
        SELECT *
        FROM view_bao_cao_linh_vuc_raw
        WHERE (${from}::timestamp IS NULL OR thoi_gian_tao >= ${from}::timestamp)
        AND (${to}::timestamp IS NULL OR thoi_gian_tao <= ${to}::timestamp)
    `;
  },

  async getBaoCaoTrangThai({ from, to }) {
    return prisma.$queryRaw`
        WITH latest_status AS (
            SELECT DISTINCT ON (id_phan_anh)
                id_phan_anh,
                ten AS trang_thai,
                thoi_gian_tao
            FROM lich_su_trang_thai
            ORDER BY id_phan_anh, thoi_gian_tao DESC
        )
        SELECT 
            pa.id,
            pa.thoi_gian_tao,
            ls.trang_thai
        FROM phan_anh pa
        LEFT JOIN latest_status ls 
            ON ls.id_phan_anh = pa.id
        WHERE 
            (${from}::timestamp IS NULL OR pa.thoi_gian_tao >= ${from})
        AND (${to}::timestamp IS NULL OR pa.thoi_gian_tao <= ${to});
    `;
  },

  async getReportPhanAnh(from, to, idLinhVuc) {
    let whereClause = {
      ...(idLinhVuc && { id_linh_vuc_phan_anh: idLinhVuc }),
    };
    if (from && to) {
      const startDateVN = `${from}T00:00:00`;
      const endDateVN = `${to}T23:59:59.999`;

      const startDateUTC = new Date(
        new Date(startDateVN).getTime() - 7 * 60 * 60 * 1000
      );
      const endDateUTC = new Date(
        new Date(endDateVN).getTime() - 7 * 60 * 60 * 1000
      );

      whereClause.thoi_gian_tao = {
        gte: startDateUTC,
        lte: endDateUTC,
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

    return { phanAnh, phanAnhMoiCapNhat, linh_vuc };
  },

  async getReportThuTuc(from, to) {
    let whereClause = {};
    if (from && to) {
      const startDateVN = `${from}T00:00:00`;
      const endDateVN = `${to}T23:59:59.999`;

      const startDateUTC = new Date(
        new Date(startDateVN).getTime() - 7 * 60 * 60 * 1000
      );
      const endDateUTC = new Date(
        new Date(endDateVN).getTime() - 7 * 60 * 60 * 1000
      );

      whereClause.thoi_gian_tao = {
        gte: startDateUTC,
        lte: endDateUTC,
      };
    }

    let linhVuc = await prisma.thu_tuc_hanh_chinh.findMany({
      where: whereClause,
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
      prisma.thu_tuc_hanh_chinh.count(),
      prisma.thu_tuc_hanh_chinh.count({
        where: {
          thu_tuc_hanh_chinh_mau_don: {
            some: {},
          },
        },
      }),
    ]);

    return { linhVuc, totalThuTuc, totalThuTucCoMauDon };
  },
};

export default ReportRepository;
