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
  }
};

export default ReportRepository;
