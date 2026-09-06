import prisma from "../config/database.config.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import {
  getPhanAnhMucDoFilterValues,
} from "../constants/phan-anh-muc-do.constant.js";
import {
  enrichPhanAnhResponses,
} from "../utils/phan-anh-response.util.js";
import { aggregatePhanAnhByKhuPho, normalizeKhuPhoLabel } from "../utils/phan-anh-statistics.util.js";

const ATTACHMENT_SELECT = {
  id: true,
  dinh_dang_file: true,
  url_file: true,
  kich_thuoc_file_mb: true,
  loai: true,
};

const BASIC_VIDEO_SELECT = {
  id: true,
  status: true,
  final_hls_url: true,
  created_at: true,
  updated_at: true,
};

const DETAIL_VIDEO_SELECT = {
  ...BASIC_VIDEO_SELECT,
  final_mp4_url: true,
};

const mapMediaForPhanAnh = async (
  phanAnhOrList,
  { includeFinalMp4 = false } = {},
) => {
  const items = Array.isArray(phanAnhOrList) ? phanAnhOrList : [phanAnhOrList];
  const validItems = items.filter(Boolean);

  if (validItems.length === 0) {
    return Array.isArray(phanAnhOrList) ? [] : phanAnhOrList;
  }

  const allVideoIds = validItems.flatMap((item) => {
    const idVideo = Array.isArray(item.id_video) ? item.id_video : [];
    const idVideoGiaiQuyet = Array.isArray(item.id_video_giai_quyet)
      ? item.id_video_giai_quyet
      : [];
    return [...idVideo, ...idVideoGiaiQuyet];
  });

  const uniqueVideoIds = [...new Set(allVideoIds.filter(Boolean))];
  let videosMap = new Map();

  if (uniqueVideoIds.length > 0) {
    const videos = await prisma.video_uploads.findMany({
      where: { id: { in: uniqueVideoIds } },
      select: includeFinalMp4 ? DETAIL_VIDEO_SELECT : BASIC_VIDEO_SELECT,
    });
    videosMap = new Map(videos.map((video) => [video.id, video]));
  }

  const normalized = validItems.map((item) => {
    const videoCongDan = Array.isArray(item.id_video) ? item.id_video : [];
    const videoGiaiQuyet = Array.isArray(item.id_video_giai_quyet)
      ? item.id_video_giai_quyet
      : [];

    return {
      ...item,
      videos: videoCongDan.map((id) => videosMap.get(id)).filter(Boolean),
      videos_giai_quyet: videoGiaiQuyet
        .map((id) => videosMap.get(id))
        .filter(Boolean),
    };
  });

  return enrichPhanAnhResponses(
    Array.isArray(phanAnhOrList) ? normalized : normalized[0],
  );
};

const PhanAnhRepository = {
  async createWithInitialState(data, initialStatus, attachments = []) {
    return prisma.$transaction(async (tx) => {
      const createdPhanAnh = await tx.phan_anh.create({ data });
      const trangThai = await tx.lich_su_trang_thai.create({
        data: {
          ...initialStatus,
          id_phan_anh: createdPhanAnh.id,
        },
      });

      if (attachments.length > 0) {
        await tx.dinh_kem_phan_anh.createMany({
          data: attachments.map((attachment) => ({
            ...attachment,
            id_phan_anh: createdPhanAnh.id,
          })),
        });
      }

      return { createdPhanAnh, trangThai };
    });
  },

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
            ghi_chu: true,
          },
        },
        dinh_kem_phan_anh: {
          select: ATTACHMENT_SELECT,
        },
        linh_vuc_phan_anh: {
          select: {
            ten: true,
          },
        },
        to_phu_trach: {
          select: { ho_va_ten: true },
        },
      },
    });

    return await mapMediaForPhanAnh(phanAnh, { includeFinalMp4: true });
  },

  async getAll(
    idLinhVucPhanAnh,
    trangThai,
    mucDo,
    maPhanAnh,
    page,
    size,
    sortTime,
    sortBy,
    sortOrder,
  ) {
    const skip = (page - 1) * size;

    // Whitelist cột sort (chống SQL injection vì query là raw). sortBy ưu tiên;
    // không có sortBy thì giữ tương thích cũ (sort theo thời gian + sortTime).
    const SORT_COLUMNS = {
      thoi_gian_tao: "pa.thoi_gian_tao",
      ma_phan_anh: "pa.ma_phan_anh",
      tieu_de: "pa.tieu_de",
      muc_do: "pa.muc_do",
      trang_thai: "lst.ten",
    };
    const sortColumn = SORT_COLUMNS[sortBy] || "pa.thoi_gian_tao";
    const orderDirection =
      (sortBy ? sortOrder : sortTime) === "asc" ? "ASC" : "DESC";

    const params = [];
    let whereSql = `WHERE 1=1 AND (pa.is_approve = true OR pa.is_approve IS NULL)`;

    if (idLinhVucPhanAnh) {
      params.push(idLinhVucPhanAnh);
      whereSql += ` AND pa.id_linh_vuc_phan_anh = $${params.length}::uuid`;
    }

    if (mucDo) {
      params.push(getPhanAnhMucDoFilterValues(mucDo));
      whereSql += ` AND pa.muc_do = ANY($${params.length}::text[])`;
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
        ORDER BY 
          CASE 
            WHEN (LOWER(pa.muc_do) LIKE '%khẩn%' OR LOWER(pa.muc_do) LIKE '%khan%')
                 AND lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối') THEN 1
            WHEN lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối') 
                 AND pa.ngay_du_kien_hoan_thanh IS NOT NULL 
                 AND pa.ngay_du_kien_hoan_thanh < NOW() THEN 2
            ELSE 3
          END ASC,
          ${sortColumn} ${orderDirection}, pa.thoi_gian_tao DESC
        LIMIT $${params.length - 1} OFFSET $${params.length};
    `,
      ...params,
    );

    const ids = rows.map((r) => r.id);

    // Count & Stats tổng cho tập kết quả khớp bộ lọc
    const statsResult = await prisma.$queryRawUnsafe(
      `
        WITH latest_status AS (
            SELECT DISTINCT ON (id_phan_anh)
                id_phan_anh, ten, thoi_gian_tao
            FROM lich_su_trang_thai
            ORDER BY id_phan_anh, thoi_gian_tao DESC
        )
        SELECT
            COUNT(*)::int AS total,
            COUNT(CASE WHEN lst.ten = 'Đang xử lý' THEN 1 END)::int AS processing,
            COUNT(CASE WHEN lst.ten IN ('Đã giải quyết', 'Đóng') THEN 1 END)::int AS resolved,
            COUNT(CASE WHEN lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối') AND pa.ngay_du_kien_hoan_thanh IS NOT NULL AND pa.ngay_du_kien_hoan_thanh < NOW() THEN 1 END)::int AS overdue
        FROM phan_anh pa
        JOIN latest_status lst ON lst.id_phan_anh = pa.id
        ${whereSql};
    `,
      ...params.slice(0, params.length - 2),
    );

    const stats = {
      total: Number(statsResult[0]?.total) || 0,
      processing: Number(statsResult[0]?.processing) || 0,
      resolved: Number(statsResult[0]?.resolved) || 0,
      overdue: Number(statsResult[0]?.overdue) || 0,
    };

    if (ids.length === 0) {
      return { data: [], totalItems: stats.total, stats };
    }

    // Fetch dữ liệu full bằng Prisma (include đầy đủ)
    const phanAnhs = await prisma.phan_anh.findMany({
      where: { id: { in: ids } },
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
        to_phu_trach: {
          select: { id: true, ho_va_ten: true, email: true },
        },
        dinh_kem_phan_anh: {
          select: ATTACHMENT_SELECT,
        },
      },
    });

    // findMany theo id IN (...) không giữ thứ tự → sắp lại đúng thứ tự đã sort từ raw SQL.
    const idOrder = new Map(ids.map((id, i) => [id, i]));
    phanAnhs.sort((a, b) => idOrder.get(a.id) - idOrder.get(b.id));

    return {
      data: await mapMediaForPhanAnh(phanAnhs),
      totalItems: stats.total,
      stats,
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
      select: {
        id: true,
        ten: true,
        ghi_chu: true,
        thoi_gian_tao: true,
        nguoi_tao: true,
        nguoi_dung: {
          select: { id: true, ho_va_ten: true, ten_dang_nhap: true },
        },
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
          select: ATTACHMENT_SELECT,
        },
        linh_vuc_phan_anh: {
          select: {
            ten: true,
          },
        },
      },
    });

    return await mapMediaForPhanAnh(phanAnhs);
  },

  async updateStatusWithHistory(
    idPhanAnh,
    phanAnhPatch,
    historyData,
    dinhKems = [],
  ) {
    return await prisma.$transaction(async (tx) => {
      // Cập nhật bảng phản ánh
      const updated = await tx.phan_anh.update({
        where: { id: idPhanAnh },
        data: {
          thoi_gian_tiep_nhan: phanAnhPatch.thoi_gian_tiep_nhan,
          thoi_gian_phan_hoi_du_kien: phanAnhPatch.thoi_gian_phan_hoi_du_kien,
          ngay_du_kien_hoan_thanh: phanAnhPatch.ngay_du_kien_hoan_thanh,
          id_to: phanAnhPatch.id_to,
          nguoi_cap_nhat: phanAnhPatch.nguoi_cap_nhat,
          // undefined → Prisma bỏ qua (giữ nguyên); chỉ set khi có video giải quyết
          id_video_giai_quyet: phanAnhPatch.id_video_giai_quyet,
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
      return updated;
    });
  },

  async getTongQuanPhanAnh(cateList, options = {}) {
    const { fromDate, toDate, khuPho } = options || {};
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

    let startDate, endDate;
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else if (fromDate) {
      startDate = new Date(fromDate);
      endDate = new Date(now);
    } else {
      endDate = new Date(now);
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }

    const durationMs = Math.max(endDate.getTime() - startDate.getTime(), 24 * 60 * 60 * 1000);
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(startDate.getTime() - durationMs);

    const cateFilter = Array.isArray(cateList) && cateList.length > 0
      ? { id_linh_vuc_phan_anh: { in: cateList } }
      : {};

    let khuPhoFilter = {};
    let kpPad = '';
    let kpNum = '';

    if (khuPho && khuPho !== 'all') {
      const kpStr = String(khuPho).trim();
      const digits = kpStr.replace(/\D/g, '');
      kpNum = digits ? String(parseInt(digits, 10)) : '';
      kpPad = digits ? digits.padStart(2, '0') : '';

      const orConditions = [
        { khu_pho: { contains: kpStr, mode: 'insensitive' } }
      ];
      if (kpPad) {
        orConditions.push({ khu_pho: { contains: kpPad, mode: 'insensitive' } });
        orConditions.push({ khu_pho: { contains: `Khu phố ${kpPad}`, mode: 'insensitive' } });
        orConditions.push({ khu_pho: { contains: `KP ${kpPad}`, mode: 'insensitive' } });
        orConditions.push({ khu_pho: { contains: `KP${kpPad}`, mode: 'insensitive' } });
      }
      if (kpNum && kpNum !== kpPad) {
        orConditions.push({ khu_pho: { contains: kpNum, mode: 'insensitive' } });
        orConditions.push({ khu_pho: { contains: `Khu phố ${kpNum}`, mode: 'insensitive' } });
        orConditions.push({ khu_pho: { contains: `KP ${kpNum}`, mode: 'insensitive' } });
        orConditions.push({ khu_pho: { contains: `KP${kpNum}`, mode: 'insensitive' } });
      }

      khuPhoFilter = { OR: orConditions };
    }

    const baseWhere = {
      ...cateFilter,
      AND: [
        { OR: [{ is_approve: true }, { is_approve: null }] },
        ...(khuPhoFilter.OR ? [khuPhoFilter] : [])
      ]
    };

    // Tổng số trạng thái tạo hôm nay theo UTC
    const tongHomNay = await prisma.phan_anh.count({
      where: {
        ...baseWhere,
        thoi_gian_tao: {
          gte: startOfTodayUTC,
          lte: endOfTodayUTC,
        },
      },
    });

    let whereSql = `WHERE 1=1 AND (pa.is_approve = true OR pa.is_approve IS NULL)`;
    const params = [];
    if (Array.isArray(cateList) && cateList.length > 0) {
      params.push(cateList);
      whereSql += ` AND pa.id_linh_vuc_phan_anh = ANY($${params.length}::uuid[])`;
    }
    if (khuPho && khuPho !== 'all') {
      const kpStr = String(khuPho).trim();
      params.push(`%${kpPad || kpStr}%`);
      const p1 = params.length;
      params.push(`%${kpNum || kpStr}%`);
      const p2 = params.length;
      whereSql += ` AND (pa.khu_pho ILIKE $${p1} OR pa.khu_pho ILIKE $${p2})`;
    }

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
                JOIN phan_anh pa ON pa.id = ls.id_phan_anh
                ${whereSql}
            )
            SELECT ten, COUNT(*)::int AS count
            FROM latest_status
            WHERE rn = 1
            GROUP BY ten;
        `, ...params);

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

    const tongSo = await prisma.phan_anh.count({
      where: baseWhere,
    });

    // Tỷ lệ xử lý (%)
    const resolvedAndClosed = (thongKeTheoTrangThai['Đã giải quyết'] || 0) + (thongKeTheoTrangThai['Đóng'] || 0);
    const tyLeXuLy = tongSo > 0 ? (resolvedAndClosed / tongSo) * 100 : 0;

    // 1. Phản ánh count current vs previous
    const currPhanAnhCount = await prisma.phan_anh.count({
      where: {
        ...baseWhere,
        thoi_gian_tao: { gte: startDate, lte: endDate },
      },
    });

    const prevPhanAnhCount = await prisma.phan_anh.count({
      where: {
        ...baseWhere,
        thoi_gian_tao: { gte: prevStartDate, lte: prevEndDate },
      },
    });

    let ptPhanAnh = 0;
    if (prevPhanAnhCount === 0) {
      ptPhanAnh = currPhanAnhCount > 0 ? 100 : 0;
    } else {
      ptPhanAnh = ((currPhanAnhCount - prevPhanAnhCount) / prevPhanAnhCount) * 100;
    }
    const huongPhanAnh = ptPhanAnh >= 0 ? 'up' : 'down';

    // 2. Người dân sử dụng (unique sdt) current vs previous
    const tongNguoiDanGroup = await prisma.phan_anh.groupBy({
      by: ['sdt_nguoi_phan_anh'],
      where: {
        ...baseWhere,
        NOT: [
          { sdt_nguoi_phan_anh: null },
          { sdt_nguoi_phan_anh: '' },
        ],
      },
    });
    const tongNguoiDan = tongNguoiDanGroup.length;

    const currNguoiDanGroup = await prisma.phan_anh.groupBy({
      by: ['sdt_nguoi_phan_anh'],
      where: {
        ...baseWhere,
        thoi_gian_tao: { gte: startDate, lte: endDate },
        NOT: [{ sdt_nguoi_phan_anh: null }, { sdt_nguoi_phan_anh: '' }],
      },
    });
    const currNguoiDan = currNguoiDanGroup.length;

    const prevNguoiDanGroup = await prisma.phan_anh.groupBy({
      by: ['sdt_nguoi_phan_anh'],
      where: {
        ...baseWhere,
        thoi_gian_tao: { gte: prevStartDate, lte: prevEndDate },
        NOT: [{ sdt_nguoi_phan_anh: null }, { sdt_nguoi_phan_anh: '' }],
      },
    });
    const prevNguoiDan = prevNguoiDanGroup.length;

    let ptNguoiDan = 0;
    if (prevNguoiDan === 0) {
      ptNguoiDan = currNguoiDan > 0 ? 100 : 0;
    } else {
      ptNguoiDan = ((currNguoiDan - prevNguoiDan) / prevNguoiDan) * 100;
    }
    const huongNguoiDan = ptNguoiDan >= 0 ? 'up' : 'down';

    // 3. Tỷ lệ xử lý kỳ trước
    let prevWhereSql = `WHERE (pa.is_approve = true OR pa.is_approve IS NULL) AND pa.thoi_gian_tao >= $1 AND pa.thoi_gian_tao <= $2`;
    const prevParams = [prevStartDate, prevEndDate];
    if (Array.isArray(cateList) && cateList.length > 0) {
      prevParams.push(cateList);
      prevWhereSql += ` AND pa.id_linh_vuc_phan_anh = ANY($${prevParams.length}::uuid[])`;
    }
    if (khuPho && khuPho !== 'all') {
      const kpStr = String(khuPho).trim();
      prevParams.push(`%${kpPad || kpStr}%`);
      const p1 = prevParams.length;
      prevParams.push(`%${kpNum || kpStr}%`);
      const p2 = prevParams.length;
      prevWhereSql += ` AND (pa.khu_pho ILIKE $${p1} OR pa.khu_pho ILIKE $${p2})`;
    }

    const prevStatusRows = await prisma.$queryRawUnsafe(`
      WITH latest_status AS (
        SELECT ls.ten, ROW_NUMBER() OVER (PARTITION BY ls.id_phan_anh ORDER BY ls.thoi_gian_tao DESC) AS rn
        FROM lich_su_trang_thai ls
        JOIN phan_anh pa ON pa.id = ls.id_phan_anh
        ${prevWhereSql}
      )
      SELECT ten, COUNT(*)::int AS count FROM latest_status WHERE rn = 1 GROUP BY ten;
    `, ...prevParams);

    let prevResolvedAndClosed = 0;
    prevStatusRows.forEach((r) => {
      if (r.ten === 'Đã giải quyết' || r.ten === 'Đóng') {
        prevResolvedAndClosed += Number(r.count) || 0;
      }
    });

    const prevTyLeXuLy = prevPhanAnhCount === 0 ? 0 : (prevResolvedAndClosed / prevPhanAnhCount) * 100;
    const ptTyLeXuLy = tyLeXuLy - prevTyLeXuLy;
    const huongTyLeXuLy = ptTyLeXuLy >= 0 ? 'up' : 'down';

    const quaHanRows = await prisma.$queryRawUnsafe(`
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
          JOIN phan_anh pa ON pa.id = ls.id_phan_anh
          ${whereSql}
      )
      SELECT COUNT(*)::int AS count
      FROM latest_status ls
      JOIN phan_anh pa ON pa.id = ls.id_phan_anh
      WHERE ls.rn = 1
        AND ls.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối')
        AND pa.ngay_du_kien_hoan_thanh IS NOT NULL
        AND pa.ngay_du_kien_hoan_thanh < NOW();
    `, ...params);

    const quaHan = Number(quaHanRows[0]?.count) || 0;

    const topKhuPhoRows = await prisma.$queryRawUnsafe(`
      WITH latest_status AS (
          SELECT
              ls.id_phan_anh,
              ls.ten AS status_ten,
              ROW_NUMBER() OVER (
                  PARTITION BY ls.id_phan_anh
                  ORDER BY ls.thoi_gian_tao DESC
              ) AS rn
          FROM lich_su_trang_thai ls
          JOIN phan_anh pa ON pa.id = ls.id_phan_anh
          ${whereSql}
      )
      SELECT 
          pa.khu_pho,
          COUNT(pa.id)::int AS total,
          COUNT(CASE WHEN ls.status_ten IN ('Đã giải quyết', 'Đóng') THEN 1 END)::int AS resolved
      FROM phan_anh pa
      JOIN latest_status ls ON ls.id_phan_anh = pa.id AND ls.rn = 1
      WHERE pa.khu_pho IS NOT NULL AND TRIM(pa.khu_pho) != ''
      GROUP BY pa.khu_pho
      ORDER BY total DESC, (COUNT(CASE WHEN ls.status_ten IN ('Đã giải quyết', 'Đóng') THEN 1 END)::float / NULLIF(COUNT(pa.id), 0)) DESC
      LIMIT 7;
    `, ...params);

    const topKhuPho = topKhuPhoRows.map((r, index) => {
      const total = Number(r.total) || 0;
      const resolved = Number(r.resolved) || 0;
      const rateVal = total > 0 ? (resolved / total) * 100 : 0;
      const rateFormatted = `${Math.round(rateVal)}%`;
      const nameStr = normalizeKhuPhoLabel(r.khu_pho);
      const name = nameStr.startsWith("KP")
        ? nameStr.replace(/^KP\s*/i, "Khu phố ")
        : (nameStr.startsWith("Khu phố") ? nameStr : `Khu phố ${nameStr}`);

      return {
        rank: index + 1,
        name: name,
        total: total,
        rate: rateFormatted,
      };
    });

    const linhVucRows = await prisma.$queryRawUnsafe(`
      SELECT 
          COALESCE(lv.ten, 'Khác') AS name,
          COUNT(pa.id)::int AS count
      FROM phan_anh pa
      LEFT JOIN linh_vuc_phan_anh lv ON lv.id = pa.id_linh_vuc_phan_anh
      ${whereSql}
      GROUP BY COALESCE(lv.ten, 'Khác')
      ORDER BY count DESC;
    `, ...params);

    const PALETTE = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#6366F1', '#EC4899', '#14B8A6', 
      '#F97316', '#9CA3AF'
    ];

    const totalLinhVucCount = linhVucRows.reduce((sum, r) => sum + (Number(r.count) || 0), 0);

    const thongKeTheoLinhVuc = linhVucRows.map((r, index) => {
      const count = Number(r.count) || 0;
      const percent = totalLinhVucCount > 0 ? Math.round((count / totalLinhVucCount) * 100) : 0;
      return {
        name: r.name,
        count: count,
        percent: percent,
        color: PALETTE[index % PALETTE.length],
      };
    });

    const resolutionRateRows = await prisma.$queryRawUnsafe(`
      WITH latest_status AS (
          SELECT
              ls.id_phan_anh,
              ls.ten AS status_ten,
              ROW_NUMBER() OVER (
                  PARTITION BY ls.id_phan_anh
                  ORDER BY ls.thoi_gian_tao DESC
              ) AS rn
          FROM lich_su_trang_thai ls
          JOIN phan_anh pa ON pa.id = ls.id_phan_anh
          ${whereSql}
      )
      SELECT 
          pa.khu_pho,
          COUNT(pa.id)::int AS total,
          COUNT(CASE WHEN ls.status_ten IN ('Đã giải quyết', 'Đóng') THEN 1 END)::int AS resolved
      FROM phan_anh pa
      JOIN latest_status ls ON ls.id_phan_anh = pa.id AND ls.rn = 1
      WHERE pa.khu_pho IS NOT NULL AND TRIM(pa.khu_pho) != ''
      GROUP BY pa.khu_pho;
    `, ...params);

    const rateMap = new Map();
    resolutionRateRows.forEach((r) => {
      const label = normalizeKhuPhoLabel(r.khu_pho);
      if (!label) return;
      const key = label.normalize("NFC").toLowerCase();
      const digits = key.replace(/\D/g, '');
      const num = digits ? parseInt(digits, 10) : null;

      const total = Number(r.total) || 0;
      const resolved = Number(r.resolved) || 0;
      const rateVal = total > 0 ? Math.round((resolved / total) * 100) : 0;

      if (num !== null) {
        rateMap.set(`kp_${num}`, rateVal);
      }
      rateMap.set(key, rateVal);
    });

    const tyLeXuLyTheoKhuPho = Array.from({ length: 45 }, (_, i) => {
      const num = i + 1;
      const padNum = String(num).padStart(2, '0');
      const name = `KP ${padNum}`;
      const rate = rateMap.get(`kp_${num}`) ?? rateMap.get(`khu phố ${padNum}`) ?? rateMap.get(`kp ${padNum}`) ?? 0;
      return {
        name,
        rate,
      };
    });

    const deadlineRows = await prisma.$queryRawUnsafe(`
      WITH latest_status AS (
          SELECT
              ls.id_phan_anh,
              ls.ten AS status_ten,
              ls.thoi_gian_tao AS status_time,
              ROW_NUMBER() OVER (
                  PARTITION BY ls.id_phan_anh
                  ORDER BY ls.thoi_gian_tao DESC
              ) AS rn
          FROM lich_su_trang_thai ls
          JOIN phan_anh pa ON pa.id = ls.id_phan_anh
          ${whereSql}
      ),
      deadline_classification AS (
          SELECT
              pa.id,
              CASE
                  WHEN pa.ngay_du_kien_hoan_thanh IS NULL THEN 'Chưa XĐ'
                  WHEN ls.status_ten IN ('Đã giải quyết', 'Đóng') THEN
                      CASE 
                          WHEN ls.status_time <= pa.ngay_du_kien_hoan_thanh THEN 'Đúng hạn'
                          ELSE 'Quá hạn'
                      END
                  WHEN ls.status_ten = 'Từ chối' THEN 'Đúng hạn'
                  WHEN pa.ngay_du_kien_hoan_thanh < NOW() THEN 'Quá hạn'
                  WHEN pa.ngay_du_kien_hoan_thanh <= NOW() + INTERVAL '2 days' THEN 'Sắp đến hạn'
                  ELSE 'Đúng hạn'
              END AS label
          FROM phan_anh pa
          JOIN latest_status ls ON ls.id_phan_anh = pa.id AND ls.rn = 1
      )
      SELECT 
          label,
          COUNT(*)::int AS count
      FROM deadline_classification
      GROUP BY label;
    `, ...params);

    const deadlineCounts = {
      'Đúng hạn': 0,
      'Sắp đến hạn': 0,
      'Quá hạn': 0,
      'Chưa XĐ': 0,
    };

    deadlineRows.forEach((r) => {
      if (Object.prototype.hasOwnProperty.call(deadlineCounts, r.label)) {
        deadlineCounts[r.label] = Number(r.count) || 0;
      }
    });

    const totalDeadlineCount = Object.values(deadlineCounts).reduce((a, b) => a + b, 0);

    const DEADLINE_COLOR_MAP = {
      'Đúng hạn': '#10B981',
      'Sắp đến hạn': '#F59E0B',
      'Quá hạn': '#EF4444',
      'Chưa XĐ': '#94A3B8',
    };

    const thongKeTheoHanXuLy = Object.keys(deadlineCounts).map((key) => {
      const count = deadlineCounts[key];
      const percent = totalDeadlineCount > 0 ? Math.round((count / totalDeadlineCount) * 100) : 0;
      return {
        label: key,
        count: count,
        percent: percent,
        color: DEADLINE_COLOR_MAP[key],
      };
    });

    const trendParams = [...params, startDate, endDate];
    const startDateIdx = trendParams.length - 1;
    const endDateIdx = trendParams.length;

    const trendRows = await prisma.$queryRawUnsafe(`
      WITH date_series AS (
          SELECT generate_series(
              $${startDateIdx}::date,
              $${endDateIdx}::date,
              '1 day'::interval
          )::date AS day
      ),
      latest_status AS (
          SELECT
              ls.id_phan_anh,
              ls.ten AS status_ten,
              ls.thoi_gian_tao AS status_time,
              ROW_NUMBER() OVER (
                  PARTITION BY ls.id_phan_anh
                  ORDER BY ls.thoi_gian_tao DESC
              ) AS rn
          FROM lich_su_trang_thai ls
          JOIN phan_anh pa ON pa.id = ls.id_phan_anh
          ${whereSql}
      )
      SELECT 
          TO_CHAR(ds.day, 'DD-MM') AS date,
          COUNT(pa.id)::int AS tong_phan_anh,
          COUNT(CASE WHEN ls.status_ten IN ('Đã giải quyết', 'Đóng') THEN 1 END)::int AS hoan_thanh,
          COUNT(CASE WHEN (ls.status_ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối') AND pa.ngay_du_kien_hoan_thanh IS NOT NULL AND pa.ngay_du_kien_hoan_thanh < ds.day + INTERVAL '1 day') OR (ls.status_ten IN ('Đã giải quyết', 'Đóng') AND ls.status_time > pa.ngay_du_kien_hoan_thanh) THEN 1 END)::int AS qua_han
      FROM date_series ds
      LEFT JOIN phan_anh pa ON pa.thoi_gian_tao::date = ds.day AND (pa.is_approve = true OR pa.is_approve IS NULL)
      LEFT JOIN latest_status ls ON ls.id_phan_anh = pa.id AND ls.rn = 1
      GROUP BY ds.day
      ORDER BY ds.day ASC;
    `, ...trendParams);

    const xuHuongPhanAnh = trendRows.map((r) => ({
      date: r.date,
      hoanThanh: Number(r.hoan_thanh) || 0,
      quaHan: Number(r.qua_han) || 0,
      tongPhanAnh: Number(r.tong_phan_anh) || 0,
    }));

    const khuPhoRecords = await prisma.phan_anh.findMany({
      where: cateFilter,
      select: { khu_pho: true },
    });
    const thongKeTheoKhuPho = aggregatePhanAnhByKhuPho(khuPhoRecords);

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
      tong_so: tongSo,
      tong_hom_nay: tongHomNay,
      tong_nguoi_dan: tongNguoiDan,
      ty_le_xu_ly: Number(tyLeXuLy.toFixed(1)),
      pt_nguoi_dan: Math.abs(Number(ptNguoiDan.toFixed(1))),
      pt_phan_anh: Math.abs(Number(ptPhanAnh.toFixed(1))),
      pt_ty_le_xu_ly: Math.abs(Number(ptTyLeXuLy.toFixed(1))),
      huong_nguoi_dan: huongNguoiDan,
      huong_phan_anh: huongPhanAnh,
      huong_ty_le_xu_ly: huongTyLeXuLy,
      qua_han: quaHan,
      thong_ke_theo_trang_thai: thongKeTheoTrangThai,
      thong_ke_theo_khu_pho: thongKeTheoKhuPho,
      thong_ke_theo_linh_vuc: thongKeTheoLinhVuc,
      thong_ke_theo_han_xu_ly: thongKeTheoHanXuLy,
      xu_huong_phan_anh: xuHuongPhanAnh,
      ty_le_xu_ly_theo_khu_pho: tyLeXuLyTheoKhuPho,
      top_khu_pho: topKhuPho,
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
    sortBy,
    sortOrder,
  ) {
    if (!cateList || cateList.length === 0) {
      return { data: [], totalItems: 0 };
    }

    const skip = (page - 1) * size;
    const SORT_COLUMNS = {
      thoi_gian_tao: "pa.thoi_gian_tao",
      ma_phan_anh: "pa.ma_phan_anh",
      tieu_de: "pa.tieu_de",
      muc_do: "pa.muc_do",
      trang_thai: "lst.ten",
    };
    const sortColumn = SORT_COLUMNS[sortBy] || "pa.thoi_gian_tao";
    const orderDirection =
      (sortBy ? sortOrder : sortTime) === "asc" ? "ASC" : "DESC";

    const params = [];
    let whereSql = `WHERE 1=1 AND (pa.is_approve = true OR pa.is_approve IS NULL)`;

    if (idLinhVucPhanAnh) {
      params.push(idLinhVucPhanAnh);
      whereSql += ` AND pa.id_linh_vuc_phan_anh = $${params.length}::uuid`;
    } else if (cateList && cateList.length > 0) {
      params.push(cateList);
      whereSql += ` AND pa.id_linh_vuc_phan_anh = ANY($${params.length}::uuid[])`;
    }

    if (mucDo) {
      params.push(getPhanAnhMucDoFilterValues(mucDo));
      whereSql += ` AND pa.muc_do = ANY($${params.length}::text[])`;
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
      ORDER BY 
        CASE 
          WHEN (LOWER(pa.muc_do) LIKE '%khẩn%' OR LOWER(pa.muc_do) LIKE '%khan%')
               AND lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối') THEN 1
          WHEN lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối') 
               AND pa.ngay_du_kien_hoan_thanh IS NOT NULL 
               AND pa.ngay_du_kien_hoan_thanh < NOW() THEN 2
          ELSE 3
        END ASC,
        ${sortColumn} ${orderDirection}, pa.thoi_gian_tao DESC
      LIMIT $${params.length - 1} OFFSET $${params.length};
    `,
      ...params,
    );

    const ids = rows.map((r) => r.id);
    const statsResult = await prisma.$queryRawUnsafe(
      `
        WITH latest_status AS (
            SELECT DISTINCT ON (id_phan_anh)
                id_phan_anh, ten, thoi_gian_tao
            FROM lich_su_trang_thai
            ORDER BY id_phan_anh, thoi_gian_tao DESC
        )
        SELECT
            COUNT(*)::int AS total,
            COUNT(CASE WHEN lst.ten = 'Đang xử lý' THEN 1 END)::int AS processing,
            COUNT(CASE WHEN lst.ten IN ('Đã giải quyết', 'Đóng') THEN 1 END)::int AS resolved,
            COUNT(CASE WHEN lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối') AND pa.ngay_du_kien_hoan_thanh IS NOT NULL AND pa.ngay_du_kien_hoan_thanh < NOW() THEN 1 END)::int AS overdue
        FROM phan_anh pa
        JOIN latest_status lst ON lst.id_phan_anh = pa.id
        ${whereSql};
    `,
      ...params.slice(0, params.length - 2),
    );

    const stats = {
      total: Number(statsResult[0]?.total) || 0,
      processing: Number(statsResult[0]?.processing) || 0,
      resolved: Number(statsResult[0]?.resolved) || 0,
      overdue: Number(statsResult[0]?.overdue) || 0,
    };

    if (ids.length === 0) return { data: [], totalItems: stats.total, stats };

    const phanAnhs = await prisma.phan_anh.findMany({
      where: { id: { in: ids } },
      include: {
        lich_su_trang_thai: {
          orderBy: { thoi_gian_tao: "desc" },
          select: { ten: true, thoi_gian_tao: true },
        },
        linh_vuc_phan_anh: { select: { ten: true } },
        to_phu_trach: {
          select: { id: true, ho_va_ten: true, email: true },
        },
        dinh_kem_phan_anh: {
          select: ATTACHMENT_SELECT,
        },
      },
    });

    const idOrder = new Map(ids.map((id, i) => [id, i]));
    phanAnhs.sort((a, b) => idOrder.get(a.id) - idOrder.get(b.id));

    return {
      data: await mapMediaForPhanAnh(phanAnhs),
      totalItems: stats.total,
      stats,
    };
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

    return enrichPhanAnhResponses(data);
  },

  async getById(idPhanAnh) {
    const phanAnh = await prisma.phan_anh.findUnique({
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
        dinh_kem_phan_anh: {
          select: ATTACHMENT_SELECT,
        },
        linh_vuc_phan_anh: true,
        to_phu_trach: {
          select: { id: true, ho_va_ten: true, email: true },
        },
        // Người gửi (phản ánh từ tài khoản) — để lấy tên/SĐT khi không nhập tay.
        nguoi_dung_phan_anh_nguoi_taoTonguoi_dung: {
          select: {
            id: true,
            ho_va_ten: true,
            ten_dang_nhap: true,
            so_dien_thoai: true,
          },
        },
      },
    });

    return await mapMediaForPhanAnh(phanAnh);
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
