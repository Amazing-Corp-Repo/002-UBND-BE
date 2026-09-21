import prisma from "../config/database.config.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import PHAN_ANH_EXTENSION_STATUS from "../constants/phan-anh-extension-status.constant.js";
import PhanAnhDashboardRepository from "./phan-anh-dashboard.repository.js";
import { getKhuPhoVariants } from "../utils/string.util.js";

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

  return Array.isArray(phanAnhOrList) ? normalized : normalized[0];
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
            id: true,
            id_phan_anh: true,
            ten: true,
            thoi_gian_tao: true,
            ghi_chu: true,
            nguoi_tao: true,
            nguoi_dung: {
              select: { id: true, ho_va_ten: true, ten_dang_nhap: true },
            },
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
        de_nghi_gia_han_phan_anh: {
          where: { trang_thai: PHAN_ANH_EXTENSION_STATUS.APPROVED },
          orderBy: { thoi_gian_duyet: "desc" },
          select: {
            ly_do_gia_han: true,
            thoi_gian_duyet: true,
          },
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
    let whereSql = `WHERE 1=1
      AND NOT EXISTS (
        SELECT 1 FROM de_nghi_gia_han_phan_anh dngh
        WHERE dngh.id_phan_anh = pa.id
      )`;

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
            WHERE ten <> '${PHAN_ANH_STATUS.DA_GIA_HAN}'
            ORDER BY id_phan_anh, thoi_gian_tao DESC
        ) lst ON lst.id_phan_anh = pa.id
        ${whereSql}
        ORDER BY ${sortColumn} ${orderDirection}, pa.thoi_gian_tao DESC
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
            WHERE ten <> '${PHAN_ANH_STATUS.DA_GIA_HAN}'
            ORDER BY id_phan_anh, thoi_gian_tao DESC
        ) lst ON lst.id_phan_anh = pa.id
        ${whereSql};
    `,
      ...params.slice(0, params.length - 2),
    );

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
      },
    });

    // findMany theo id IN (...) không giữ thứ tự → sắp lại đúng thứ tự đã sort từ raw SQL.
    const idOrder = new Map(ids.map((id, i) => [id, i]));
    phanAnhs.sort((a, b) => idOrder.get(a.id) - idOrder.get(b.id));

    return {
      data: phanAnhs,
      totalItems: total[0].count,
    };
  },

  async getAllScoped({
    idLinhVucPhanAnh,
    trangThai,
    slaStatus,
    mucDo,
    maPhanAnh,
    search,
    khuPho,
    start,
    end,
    scopedLinhVucIds,
    page,
    size,
    sortTime,
    sortBy,
    sortOrder,
    includePendingExtension = false,
  }) {
    const skip = (page - 1) * size;
    const SORT_COLUMNS = {
      thoi_gian_tao: "pa.thoi_gian_tao",
      ma_phan_anh: "pa.ma_phan_anh",
      tieu_de: "pa.tieu_de",
      muc_do: "pa.muc_do",
      trang_thai: "lst.ten",
    };
    const sortColumn = SORT_COLUMNS[sortBy] || "pa.thoi_gian_tao";
    const orderDirection = (sortBy ? sortOrder : sortTime) === "asc" ? "ASC" : "DESC";
    const params = [];
    let whereSql = "WHERE 1=1";

    const normalizedSla = (slaStatus || "").toUpperCase();

    if (!includePendingExtension && normalizedSla !== "PENDING_EXTENSION" && normalizedSla !== "CHO_GIA_HAN" && normalizedSla !== "CHỜ GIA HẠN") {
      whereSql += ` AND NOT EXISTS (
        SELECT 1 FROM de_nghi_gia_han_phan_anh extension_req
        WHERE extension_req.id_phan_anh = pa.id
        AND extension_req.trang_thai = 'PENDING'
      )`;
    }

    if (Array.isArray(scopedLinhVucIds)) {
      if (scopedLinhVucIds.length === 0) whereSql += " AND 1=0";
      else {
        params.push(scopedLinhVucIds);
        whereSql += ` AND pa.id_linh_vuc_phan_anh = ANY($${params.length}::uuid[])`;
      }
    }
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
    const khuPhoVariants = getKhuPhoVariants(khuPho);
    if (khuPhoVariants.length > 0) {
      params.push(khuPhoVariants);
      whereSql += ` AND pa.khu_pho = ANY($${params.length})`;
    }
    if (start && end) {
      params.push(start, end);
      whereSql += ` AND pa.thoi_gian_tao >= $${params.length - 1} AND pa.thoi_gian_tao <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      whereSql += ` AND (pa.ma_phan_anh ILIKE $${params.length} OR pa.tieu_de ILIKE $${params.length} OR pa.ten_nguoi_phan_anh ILIKE $${params.length} OR pa.sdt_nguoi_phan_anh ILIKE $${params.length})`;
    }

    if (normalizedSla) {
      if (normalizedSla === "OVERDUE" || normalizedSla === "QUA_HAN" || normalizedSla === "QUÁ HẠN") {
        whereSql += ` AND ((pa.ngay_du_kien_hoan_thanh IS NOT NULL AND pa.ngay_du_kien_hoan_thanh < NOW() AND (lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối', 'DA_GIAI_QUYET', 'DONG', 'TU_CHOI') OR lst.ten IS NULL)) OR lst.ten = 'Quá hạn')`;
      } else if (normalizedSla === "NEAR_DUE" || normalizedSla === "SAP_DEN_HAN" || normalizedSla === "SẮP ĐẾN HẠN") {
        whereSql += ` AND (pa.ngay_du_kien_hoan_thanh IS NOT NULL AND pa.ngay_du_kien_hoan_thanh >= NOW() AND pa.ngay_du_kien_hoan_thanh <= NOW() + INTERVAL '24 hours' AND (lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối', 'DA_GIAI_QUYET', 'DONG', 'TU_CHOI') OR lst.ten IS NULL))`;
      } else if (normalizedSla === "ON_TIME" || normalizedSla === "CON_HAN" || normalizedSla === "CÒN HẠN" || normalizedSla === "DUNG_HAN") {
        whereSql += ` AND ((pa.ngay_du_kien_hoan_thanh IS NOT NULL AND pa.ngay_du_kien_hoan_thanh > NOW() + INTERVAL '24 hours' AND (lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối', 'DA_GIAI_QUYET', 'DONG', 'TU_CHOI') OR lst.ten IS NULL)) OR lst.ten IN ('Đã giải quyết', 'Đóng', 'DA_GIAI_QUYET', 'DONG'))`;
      } else if (normalizedSla === "PENDING_EXTENSION" || normalizedSla === "CHO_GIA_HAN" || normalizedSla === "CHỜ GIA HẠN") {
        whereSql += ` AND EXISTS (SELECT 1 FROM de_nghi_gia_han_phan_anh ext WHERE ext.id_phan_anh = pa.id AND ext.trang_thai = 'PENDING')`;
      } else if (normalizedSla === "EXTENDED" || normalizedSla === "DA_GIA_HAN" || normalizedSla === "ĐÃ GIA HẠN") {
        whereSql += ` AND EXISTS (SELECT 1 FROM de_nghi_gia_han_phan_anh ext WHERE ext.id_phan_anh = pa.id AND ext.trang_thai = 'APPROVED')`;
      } else if (normalizedSla === "REJECTED_EXTENSION" || normalizedSla === "TU_CHOI_GIA_HAN" || normalizedSla === "TỪ CHỐI GIA HẠN") {
        whereSql += ` AND EXISTS (SELECT 1 FROM de_nghi_gia_han_phan_anh ext WHERE ext.id_phan_anh = pa.id AND ext.trang_thai = 'REJECTED')`;
      }
    }

    const joinLatestStatus = `
      JOIN (
        SELECT DISTINCT ON (id_phan_anh) id_phan_anh, ten, thoi_gian_tao
        FROM lich_su_trang_thai
        WHERE ten <> '${PHAN_ANH_STATUS.DA_GIA_HAN}' AND ten <> '${PHAN_ANH_STATUS.XIN_GIA_HAN}'
        ORDER BY id_phan_anh, thoi_gian_tao DESC
      ) lst ON lst.id_phan_anh = pa.id`;

    // 1. Thống kê KPI tổng thể theo phạm vi (lĩnh vực, khu phố, kỳ báo cáo) - không bị thu hẹp bởi filter trạng thái/SLA
    const statParams = [];
    let statWhereSql = "WHERE 1=1";
    if (Array.isArray(scopedLinhVucIds)) {
      if (scopedLinhVucIds.length === 0) statWhereSql += " AND 1=0";
      else {
        statParams.push(scopedLinhVucIds);
        statWhereSql += ` AND pa.id_linh_vuc_phan_anh = ANY($${statParams.length}::uuid[])`;
      }
    }
    if (idLinhVucPhanAnh) {
      statParams.push(idLinhVucPhanAnh);
      statWhereSql += ` AND pa.id_linh_vuc_phan_anh = $${statParams.length}::uuid`;
    }
    if (khuPhoVariants.length > 0) {
      statParams.push(khuPhoVariants);
      statWhereSql += ` AND pa.khu_pho = ANY($${statParams.length})`;
    }
    if (start && end) {
      statParams.push(start, end);
      statWhereSql += ` AND pa.thoi_gian_tao >= $${statParams.length - 1} AND pa.thoi_gian_tao <= $${statParams.length}`;
    }

    const statRows = await prisma.$queryRawUnsafe(
      `SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN lst.ten IN ('Đã giải quyết', 'Đóng', 'DA_GIAI_QUYET', 'DONG') THEN 1 END)::int AS resolved,
        COUNT(CASE WHEN lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'DA_GIAI_QUYET', 'DONG', 'Từ chối', 'TU_CHOI') OR lst.ten IS NULL THEN 1 END)::int AS processing,
        COUNT(CASE WHEN (pa.ngay_du_kien_hoan_thanh IS NOT NULL AND pa.ngay_du_kien_hoan_thanh < NOW() AND (lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối', 'DA_GIAI_QUYET', 'DONG', 'TU_CHOI') OR lst.ten IS NULL)) OR lst.ten = 'Quá hạn' THEN 1 END)::int AS overdue
       FROM phan_anh pa ${joinLatestStatus} ${statWhereSql}`,
      ...statParams,
    );
    const stats = statRows[0] || { total: 0, resolved: 0, processing: 0, overdue: 0 };

    // 2. Lấy dữ liệu danh sách đã lọc kèm phân trang
    const countParams = [...params];
    params.push(size, skip);
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe(
        `SELECT pa.id FROM phan_anh pa ${joinLatestStatus} ${whereSql}
         ORDER BY ${sortColumn} ${orderDirection}, pa.thoi_gian_tao DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        ...params,
      ),
      prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total FROM phan_anh pa ${joinLatestStatus} ${whereSql}`,
        ...countParams,
      ),
    ]);

    const ids = rows.map((row) => row.id);
    const totalItems = countRows[0]?.total || 0;

    if (ids.length === 0) {
      return { data: [], totalItems: 0, stats };
    }

    const data = await prisma.phan_anh.findMany({
      where: { id: { in: ids } },
      include: {
        lich_su_trang_thai: { orderBy: { thoi_gian_tao: "desc" }, take: 1, select: { ten: true, thoi_gian_tao: true } },
        linh_vuc_phan_anh: { select: { id: true, ten: true } },
        to_phu_trach: { select: { id: true, ho_va_ten: true, email: true } },
      },
    });
    const idOrder = new Map(ids.map((id, index) => [id, index]));
    data.sort((a, b) => idOrder.get(a.id) - idOrder.get(b.id));
    return { data, totalItems, stats };
  },

  async getAllForExcelExport({
    idLinhVucPhanAnh,
    trangThai,
    slaStatus,
    mucDo,
    search,
    khuPho,
    start,
    end,
    scopedLinhVucIds,
    sortTime,
    sortBy,
    sortOrder,
  }) {
    const params = [];
    let whereSql = "WHERE 1=1";

    const normalizedSla = (slaStatus || "").toUpperCase();

    if (Array.isArray(scopedLinhVucIds)) {
      if (scopedLinhVucIds.length === 0) whereSql += " AND 1=0";
      else {
        params.push(scopedLinhVucIds);
        whereSql += ` AND pa.id_linh_vuc_phan_anh = ANY($${params.length}::uuid[])`;
      }
    }
    if (idLinhVucPhanAnh) {
      params.push(idLinhVucPhanAnh);
      whereSql += ` AND pa.id_linh_vuc_phan_anh = $${params.length}::uuid`;
    }
    if (mucDo) {
      params.push(mucDo);
      whereSql += ` AND pa.muc_do = $${params.length}`;
    }
    if (trangThai) {
      params.push(trangThai);
      whereSql += ` AND lst.ten = $${params.length}`;
    }
    const exportKhuPhoVariants = getKhuPhoVariants(khuPho);
    if (exportKhuPhoVariants.length > 0) {
      params.push(exportKhuPhoVariants);
      whereSql += ` AND pa.khu_pho = ANY($${params.length})`;
    }
    if (start && end) {
      params.push(start, end);
      whereSql += ` AND pa.thoi_gian_tao >= $${params.length - 1} AND pa.thoi_gian_tao <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      whereSql += ` AND (pa.ma_phan_anh ILIKE $${params.length} OR pa.tieu_de ILIKE $${params.length} OR pa.ten_nguoi_phan_anh ILIKE $${params.length} OR pa.sdt_nguoi_phan_anh ILIKE $${params.length})`;
    }

    if (normalizedSla) {
      if (normalizedSla === "OVERDUE" || normalizedSla === "QUA_HAN" || normalizedSla === "QUÁ HẠN") {
        whereSql += ` AND ((pa.ngay_du_kien_hoan_thanh IS NOT NULL AND pa.ngay_du_kien_hoan_thanh < NOW() AND (lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối', 'DA_GIAI_QUYET', 'DONG', 'TU_CHOI') OR lst.ten IS NULL)) OR lst.ten = 'Quá hạn')`;
      } else if (normalizedSla === "NEAR_DUE" || normalizedSla === "SAP_DEN_HAN" || normalizedSla === "SẮP ĐẾN HẠN") {
        whereSql += ` AND (pa.ngay_du_kien_hoan_thanh IS NOT NULL AND pa.ngay_du_kien_hoan_thanh >= NOW() AND pa.ngay_du_kien_hoan_thanh <= NOW() + INTERVAL '24 hours' AND (lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối', 'DA_GIAI_QUYET', 'DONG', 'TU_CHOI') OR lst.ten IS NULL))`;
      } else if (normalizedSla === "ON_TIME" || normalizedSla === "CON_HAN" || normalizedSla === "CÒN HẠN" || normalizedSla === "DUNG_HAN") {
        whereSql += ` AND ((pa.ngay_du_kien_hoan_thanh IS NOT NULL AND pa.ngay_du_kien_hoan_thanh > NOW() + INTERVAL '24 hours' AND (lst.ten NOT IN ('Đã giải quyết', 'Đóng', 'Từ chối', 'DA_GIAI_QUYET', 'DONG', 'TU_CHOI') OR lst.ten IS NULL)) OR lst.ten IN ('Đã giải quyết', 'Đóng', 'DA_GIAI_QUYET', 'DONG'))`;
      } else if (normalizedSla === "PENDING_EXTENSION" || normalizedSla === "CHO_GIA_HAN" || normalizedSla === "CHỜ GIA HẠN") {
        whereSql += ` AND EXISTS (SELECT 1 FROM de_nghi_gia_han_phan_anh ext WHERE ext.id_phan_anh = pa.id AND ext.trang_thai = 'PENDING')`;
      } else if (normalizedSla === "EXTENDED" || normalizedSla === "DA_GIA_HAN" || normalizedSla === "ĐÃ GIA HẠN") {
        whereSql += ` AND EXISTS (SELECT 1 FROM de_nghi_gia_han_phan_anh ext WHERE ext.id_phan_anh = pa.id AND ext.trang_thai = 'APPROVED')`;
      } else if (normalizedSla === "REJECTED_EXTENSION" || normalizedSla === "TU_CHOI_GIA_HAN" || normalizedSla === "TỪ CHỐI GIA HẠN") {
        whereSql += ` AND EXISTS (SELECT 1 FROM de_nghi_gia_han_phan_anh ext WHERE ext.id_phan_anh = pa.id AND ext.trang_thai = 'REJECTED')`;
      }
    }

    const joinLatestStatus = `
      JOIN (
        SELECT DISTINCT ON (id_phan_anh) id_phan_anh, ten, thoi_gian_tao
        FROM lich_su_trang_thai
        WHERE ten <> '${PHAN_ANH_STATUS.DA_GIA_HAN}' AND ten <> '${PHAN_ANH_STATUS.XIN_GIA_HAN}'
        ORDER BY id_phan_anh, thoi_gian_tao DESC
      ) lst ON lst.id_phan_anh = pa.id`;
    const SORT_COLUMNS = {
      thoi_gian_tao: "pa.thoi_gian_tao",
      ma_phan_anh: "pa.ma_phan_anh",
      tieu_de: "pa.tieu_de",
      muc_do: "pa.muc_do",
      trang_thai: "lst.ten",
    };
    const sortColumn = SORT_COLUMNS[sortBy] || "pa.thoi_gian_tao";
    const orderDirection = (sortBy ? sortOrder : sortTime) === "asc" ? "ASC" : "DESC";
    const rows = await prisma.$queryRawUnsafe(
      `SELECT pa.id FROM phan_anh pa ${joinLatestStatus} ${whereSql}
       ORDER BY ${sortColumn} ${orderDirection}, pa.id ASC`,
      ...params,
    );
    const ids = rows.map((row) => row.id);
    if (ids.length === 0) return [];

    const data = await prisma.phan_anh.findMany({
      where: { id: { in: ids } },
      include: {
        lich_su_trang_thai: {
          orderBy: { thoi_gian_tao: "desc" },
          select: { ten: true, thoi_gian_tao: true },
        },
        linh_vuc_phan_anh: { select: { ten: true } },
        de_nghi_gia_han_phan_anh: {
          select: { trang_thai: true },
        },
      },
    });
    const idOrder = new Map(ids.map((id, index) => [id, index]));
    data.sort((a, b) => idOrder.get(a.id) - idOrder.get(b.id));
    return data;
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
        OR: [
          { nguoi_tao: userId },
          { id_to: userId },
        ],
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
      await tx.phan_anh.update({
        where: { id: idPhanAnh },
        data: {
          thoi_gian_tiep_nhan: phanAnhPatch.thoi_gian_tiep_nhan,
          thoi_gian_phan_hoi_du_kien: phanAnhPatch.thoi_gian_phan_hoi_du_kien,
          ngay_du_kien_hoan_thanh: phanAnhPatch.ngay_du_kien_hoan_thanh,
          nguoi_cap_nhat: phanAnhPatch.nguoi_cap_nhat,
          // undefined → Prisma bỏ qua (giữ nguyên); chỉ set khi có video giải quyết
          id_video_giai_quyet: phanAnhPatch.id_video_giai_quyet,
          thoi_gian_cap_nhat: new Date().toISOString(),
        },
      });

      // Lấy thoi_gian_tao lớn nhất trong lịch sử hiện tại của phản ánh này để đảm bảo trạng thái mới luôn là mới nhất
      const latestHistory = await tx.lich_su_trang_thai.findFirst({
        where: { id_phan_anh: idPhanAnh },
        orderBy: { thoi_gian_tao: "desc" },
        select: { thoi_gian_tao: true },
      });

      const now = new Date();
      let statusTime = now;
      if (
        latestHistory &&
        latestHistory.thoi_gian_tao &&
        new Date(latestHistory.thoi_gian_tao).getTime() >= now.getTime()
      ) {
        statusTime = new Date(
          new Date(latestHistory.thoi_gian_tao).getTime() + 1000,
        );
      }

      // Tạo bản ghi lịch sử trạng thái
      await tx.lich_su_trang_thai.create({
        data: {
          id_phan_anh: idPhanAnh,
          ten: historyData.ten,
          ghi_chu: historyData.ghi_chu,
          nguoi_tao: historyData.nguoi_tao,
          thoi_gian_tao: statusTime,
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

  async getTongQuanPhanAnh(options = {}) {
    return PhanAnhDashboardRepository.getTongQuanPhanAnh(options);
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
          where: { ten: { not: PHAN_ANH_STATUS.DA_GIA_HAN } },
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
    let whereSql = `WHERE 1=1
      AND NOT EXISTS (
        SELECT 1 FROM de_nghi_gia_han_phan_anh dngh
        WHERE dngh.id_phan_anh = pa.id
      )`;

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
          WHERE ten <> '${PHAN_ANH_STATUS.DA_GIA_HAN}'
          ORDER BY id_phan_anh, thoi_gian_tao DESC
      ) lst ON lst.id_phan_anh = pa.id
      ${whereSql}
      ORDER BY ${sortColumn} ${orderDirection}, pa.thoi_gian_tao DESC
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
          WHERE ten <> '${PHAN_ANH_STATUS.DA_GIA_HAN}'
          ORDER BY id_phan_anh, thoi_gian_tao DESC
      ) lst ON lst.id_phan_anh = pa.id
      ${whereSql};
    `,
      ...params.slice(0, params.length - 2),
    );

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
      },
    });

    const idOrder = new Map(ids.map((id, i) => [id, i]));
    phanAnhs.sort((a, b) => idOrder.get(a.id) - idOrder.get(b.id));

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

  async updateMucDoWithHistory(idPhanAnh, patch, historyData) {
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
