import prisma from "../config/database.config.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import PHAN_ANH_EXTENSION_STATUS from "../constants/phan-anh-extension-status.constant.js";
import PHAN_ANH_MUC_DO from "../constants/phan-anh-muc-do.constant.js";
import {
  getDatePartsInVietnam,
  getSlaClassification,
} from "../utils/dashboard.util.js";

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
      AND (pa.is_approve = true OR pa.is_approve IS NULL)
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
    let whereSql = `WHERE (pa.is_approve = true OR pa.is_approve IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM de_nghi_gia_han_phan_anh dngh
        WHERE dngh.id_phan_anh = pa.id
      )`;

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
    if (khuPho && khuPho !== "all") {
      params.push(khuPho);
      whereSql += ` AND pa.khu_pho = $${params.length}`;
    }
    if (start && end) {
      params.push(start, end);
      whereSql += ` AND pa.thoi_gian_tao >= $${params.length - 1} AND pa.thoi_gian_tao <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      whereSql += ` AND (pa.ma_phan_anh ILIKE $${params.length} OR pa.tieu_de ILIKE $${params.length} OR pa.ten_nguoi_phan_anh ILIKE $${params.length} OR pa.sdt_nguoi_phan_anh ILIKE $${params.length})`;
    }

    const joinLatestStatus = `
      JOIN (
        SELECT DISTINCT ON (id_phan_anh) id_phan_anh, ten, thoi_gian_tao
        FROM lich_su_trang_thai
        WHERE ten <> '${PHAN_ANH_STATUS.DA_GIA_HAN}'
        ORDER BY id_phan_anh, thoi_gian_tao DESC
      ) lst ON lst.id_phan_anh = pa.id`;
    const countParams = [...params];
    params.push(size, skip);
    const rows = await prisma.$queryRawUnsafe(
      `SELECT pa.id FROM phan_anh pa ${joinLatestStatus} ${whereSql}
       ORDER BY ${sortColumn} ${orderDirection}, pa.thoi_gian_tao DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      ...params,
    );
    const ids = rows.map((row) => row.id);
    if (ids.length === 0) return { data: [], totalItems: 0 };
    const total = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM phan_anh pa ${joinLatestStatus} ${whereSql}`,
      ...countParams,
    );
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
    return { data, totalItems: total[0].count };
  },

  async getAllForExcelExport({
    idLinhVucPhanAnh,
    trangThai,
    mucDo,
    search,
    khuPho,
    start,
    end,
    scopedLinhVucIds,
    sortTime,
  }) {
    const params = [];
    let whereSql = "WHERE (pa.is_approve = true OR pa.is_approve IS NULL)";

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
    if (khuPho && khuPho !== "all") {
      params.push(khuPho);
      whereSql += ` AND pa.khu_pho = $${params.length}`;
    }
    if (start && end) {
      params.push(start, end);
      whereSql += ` AND pa.thoi_gian_tao >= $${params.length - 1} AND pa.thoi_gian_tao <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      whereSql += ` AND (pa.ma_phan_anh ILIKE $${params.length} OR pa.tieu_de ILIKE $${params.length} OR pa.ten_nguoi_phan_anh ILIKE $${params.length} OR pa.sdt_nguoi_phan_anh ILIKE $${params.length})`;
    }

    const joinLatestStatus = `
      JOIN (
        SELECT DISTINCT ON (id_phan_anh) id_phan_anh, ten, thoi_gian_tao
        FROM lich_su_trang_thai
        WHERE ten <> '${PHAN_ANH_STATUS.DA_GIA_HAN}'
        ORDER BY id_phan_anh, thoi_gian_tao DESC
      ) lst ON lst.id_phan_anh = pa.id`;
    const orderDirection = sortTime === "asc" ? "ASC" : "DESC";
    const rows = await prisma.$queryRawUnsafe(
      `SELECT pa.id FROM phan_anh pa ${joinLatestStatus} ${whereSql}
       ORDER BY pa.thoi_gian_tao ${orderDirection}, pa.id ASC`,
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

  async getTongQuanPhanAnh({
    currentPeriod,
    previousPeriod,
    todayPeriod,
    khuPho,
    effectiveLinhVucIds,
  } = {}) {
    const buildWhere = (period) => ({
      thoi_gian_tao: {
        gte: period.start,
        lte: period.end,
      },
      ...(khuPho && khuPho !== "all" ? { khu_pho: khuPho } : {}),
      ...(Array.isArray(effectiveLinhVucIds)
        ? { id_linh_vuc_phan_anh: { in: effectiveLinhVucIds } }
        : {}),
    });

    const select = {
      id: true,
      muc_do: true,
      khu_pho: true,
      id_linh_vuc_phan_anh: true,
      thoi_gian_tao: true,
      ngay_du_kien_hoan_thanh: true,
      linh_vuc_phan_anh: { select: { ten: true } },
      lich_su_trang_thai: {
        orderBy: { thoi_gian_tao: "desc" },
        take: 1,
        select: { ten: true, thoi_gian_tao: true },
      },
    };

    const [currentItems, previousItems, todayItems, totalCitizens, currentCitizens, previousCitizens] =
      await Promise.all([
        prisma.phan_anh.findMany({ where: buildWhere(currentPeriod), select }),
        prisma.phan_anh.findMany({ where: buildWhere(previousPeriod), select }),
        prisma.phan_anh.findMany({ where: buildWhere(todayPeriod), select }),
        prisma.nguoi_dung.count({ where: { is_active: true, is_delete: false } }),
        prisma.nguoi_dung.count({
          where: {
            is_active: true,
            is_delete: false,
            thoi_gian_tao: { gte: currentPeriod.start, lte: currentPeriod.end },
          },
        }),
        prisma.nguoi_dung.count({
          where: {
            is_active: true,
            is_delete: false,
            thoi_gian_tao: { gte: previousPeriod.start, lte: previousPeriod.end },
          },
        }),
      ]);

    const getLatestStatus = (item) => item.lich_su_trang_thai
      .find((entry) => entry.ten !== PHAN_ANH_STATUS.DA_GIA_HAN) || null;
    const isResolved = (item) => getLatestStatus(item)?.ten === PHAN_ANH_STATUS.DA_GIAI_QUYET;
    const isClosed = (item) => getLatestStatus(item)?.ten === PHAN_ANH_STATUS.DONG;
    const isOpen = (item) => !isResolved(item) && !isClosed(item);

    const statusCounts = (items) => {
      const result = Object.fromEntries(Object.values(PHAN_ANH_STATUS).map((status) => [status, 0]));
      items.forEach((item) => {
        const status = getLatestStatus(item)?.ten;
        if (status && Object.prototype.hasOwnProperty.call(result, status)) result[status] += 1;
      });
      return result;
    };

    const getSlaCounts = (items, now = new Date()) => {
      const result = { onTime: 0, soon: 0, overdue: 0 };
      items.forEach((item) => {
        const latestStatus = getLatestStatus(item);
        const completedAt = isResolved(item) && latestStatus?.thoi_gian_tao
          ? latestStatus.thoi_gian_tao
          : null;
        const classification = getSlaClassification({
          createdAt: item.thoi_gian_tao,
          deadline: item.ngay_du_kien_hoan_thanh,
          completedAt,
          now,
        });
        if (classification === "overdue") result.overdue += 1;
        if (classification === "soon") result.soon += 1;
        if (classification === "onTime") result.onTime += 1;
      });
      return result;
    };

    const currentStatus = statusCounts(currentItems);
    const previousStatus = statusCounts(previousItems);
    const currentSla = getSlaCounts(currentItems);

    const khuPhoMap = new Map();
    currentItems.forEach((item) => {
      const name = item.khu_pho || "Không xác định";
      const entry = khuPhoMap.get(name) || { name, count: 0, resolved: 0 };
      entry.count += 1;
      if (isResolved(item)) entry.resolved += 1;
      khuPhoMap.set(name, entry);
    });
    const thongKeTheoKhuPho = [...khuPhoMap.values()].map(({ name, count }) => ({ name, count }));
    const topKhuPho = [...khuPhoMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        total: item.count,
        resolved: item.resolved,
        rate: `${item.count ? ((item.resolved / item.count) * 100).toFixed(1) : "0.0"}%`,
      }));

    const linhVucMap = new Map();
    currentItems.forEach((item) => {
      const name = item.linh_vuc_phan_anh?.ten || "Không xác định";
      linhVucMap.set(name, (linhVucMap.get(name) || 0) + 1);
    });
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
    const thongKeTheoLinhVuc = [...linhVucMap.entries()].map(([name, count], index) => ({
      name,
      count,
      percent: currentItems.length ? Number(((count / currentItems.length) * 100).toFixed(1)) : 0,
      color: colors[index % colors.length],
    }));

    const trendMap = new Map();
    currentItems.forEach((item) => {
      if (!item.thoi_gian_tao) return;
      const dateParts = getDatePartsInVietnam(new Date(item.thoi_gian_tao));
      const date = `${String(dateParts.day).padStart(2, "0")}/${String(dateParts.month).padStart(2, "0")}`;
      const entry = trendMap.get(date) || { date, tongPhanAnh: 0, daGiaiQuyet: 0 };
      entry.tongPhanAnh += 1;
      if (isResolved(item)) entry.daGiaiQuyet += 1;
      trendMap.set(date, entry);
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
      tong_so: currentItems.length,
      previous_tong_so: previousItems.length,
      tong_hom_nay: todayItems.length,
      tong_nguoi_dan: totalCitizens,
      current_nguoi_dan: currentCitizens,
      previous_nguoi_dan: previousCitizens,
      current_ty_le_xu_ly: currentItems.length
        ? Number(((currentStatus[PHAN_ANH_STATUS.DA_GIAI_QUYET] / currentItems.length) * 100).toFixed(1))
        : 0,
      previous_ty_le_xu_ly: previousItems.length
        ? Number(((previousStatus[PHAN_ANH_STATUS.DA_GIAI_QUYET] / previousItems.length) * 100).toFixed(1))
        : 0,
      qua_han: currentSla.overdue,
      khan_cap: currentItems.filter(
        (item) => item.muc_do === PHAN_ANH_MUC_DO.KHAN_CAP && isOpen(item),
      ).length,
      thong_ke_theo_trang_thai: currentStatus,
      thong_ke_theo_khu_pho: thongKeTheoKhuPho,
      top_khu_pho: topKhuPho,
      ty_le_xu_ly_theo_khu_pho: topKhuPho.map((item) => ({
        name: item.name,
        rate: Number.parseFloat(item.rate),
      })),
      thong_ke_theo_linh_vuc: thongKeTheoLinhVuc,
      thong_ke_theo_han_xu_ly: [
        {
          label: "Đúng hạn",
          count: currentSla.onTime,
          percent: currentItems.length ? Number(((currentSla.onTime / currentItems.length) * 100).toFixed(1)) : 0,
          color: "#10B981",
        },
        {
          label: "Sắp trễ hạn",
          count: currentSla.soon,
          percent: currentItems.length ? Number(((currentSla.soon / currentItems.length) * 100).toFixed(1)) : 0,
          color: "#F59E0B",
        },
        {
          label: "Quá hạn",
          count: currentSla.overdue,
          percent: currentItems.length ? Number(((currentSla.overdue / currentItems.length) * 100).toFixed(1)) : 0,
          color: "#EF4444",
        },
      ],
      xu_huong_phan_anh: [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
      current_status: currentStatus,
      previous_status: previousStatus,
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
