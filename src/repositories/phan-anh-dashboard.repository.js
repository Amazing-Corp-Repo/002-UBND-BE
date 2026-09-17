import prisma from "../config/database.config.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import PHAN_ANH_MUC_DO from "../constants/phan-anh-muc-do.constant.js";
import {
  getDatePartsInVietnam,
  getSlaClassification,
} from "../utils/dashboard.util.js";

const PhanAnhDashboardRepository = {
  async getTongQuanPhanAnh({
    currentPeriod,
    previousPeriod,
    todayPeriod,
    khuPho,
    effectiveLinhVucIds,
    scopedLinhVucIds,
  } = {}) {
    const buildWhere = (period, customLinhVucIds = effectiveLinhVucIds) => ({
      ...(period && (period.start || period.end)
        ? {
            thoi_gian_tao: {
              ...(period.start ? { gte: period.start } : {}),
              ...(period.end ? { lte: period.end } : {}),
            },
          }
        : {}),
      ...(khuPho && khuPho !== "all" ? { khu_pho: khuPho } : {}),
      ...(Array.isArray(customLinhVucIds)
        ? { id_linh_vuc_phan_anh: { in: customLinhVucIds } }
        : {}),
    });

    const select = {
      id: true,
      muc_do: true,
      khu_pho: true,
      id_linh_vuc_phan_anh: true,
      thoi_gian_tao: true,
      ngay_du_kien_hoan_thanh: true,
      sdt_nguoi_phan_anh: true,
      linh_vuc_phan_anh: { select: { ten: true } },
      lich_su_trang_thai: {
        orderBy: { thoi_gian_tao: "desc" },
        take: 1,
        select: { ten: true, thoi_gian_tao: true },
      },
    };

    const buildAccumulatedWhere = (maxDate) => ({
      ...(maxDate ? { thoi_gian_tao: { lte: maxDate } } : {}),
      ...(khuPho && khuPho !== "all" ? { khu_pho: khuPho } : {}),
      ...(Array.isArray(effectiveLinhVucIds)
        ? { id_linh_vuc_phan_anh: { in: effectiveLinhVucIds } }
        : {}),
    });

    const isFilteredSpecificLinhVuc = Array.isArray(effectiveLinhVucIds) && (
      !Array.isArray(scopedLinhVucIds) || effectiveLinhVucIds.length !== scopedLinhVucIds.length
    );

    const [
      currentItems,
      previousItems,
      todayItems,
      totalAllPhanAnh,
      previousAllPhanAnh,
      totalCitizensGroup,
      scopeItemsForDept,
      activeLinhVucList,
    ] = await Promise.all([
      prisma.phan_anh.findMany({ where: buildWhere(currentPeriod), select }),
      prisma.phan_anh.findMany({ where: buildWhere(previousPeriod), select }),
      prisma.phan_anh.findMany({ where: buildWhere(todayPeriod), select }),
      prisma.phan_anh.count({ where: buildAccumulatedWhere(currentPeriod?.end) }),
      prisma.phan_anh.count({ where: buildAccumulatedWhere(previousPeriod?.end) }),
      prisma.phan_anh.groupBy({
        by: ["sdt_nguoi_phan_anh"],
        where: {
          ...buildWhere(null),
          sdt_nguoi_phan_anh: { not: null, notIn: [""] },
        },
      }),
      isFilteredSpecificLinhVuc
        ? prisma.phan_anh.findMany({ where: buildWhere(currentPeriod, scopedLinhVucIds), select })
        : Promise.resolve(null),
      prisma.linh_vuc_phan_anh.findMany({
        where: {
          is_active: true,
          is_delete: false,
          ...(Array.isArray(scopedLinhVucIds) ? { id: { in: scopedLinhVucIds } } : {}),
        },
        select: { id: true, ten: true },
      }),
    ]);

    const allScopeItems = scopeItemsForDept || currentItems;

    const totalCitizens = totalCitizensGroup.length;
    const currentCitizens = new Set(
      currentItems
        .map((i) => i.sdt_nguoi_phan_anh)
        .filter((phone) => Boolean(phone && phone.trim()))
    ).size;
    const previousCitizens = new Set(
      previousItems
        .map((i) => i.sdt_nguoi_phan_anh)
        .filter((phone) => Boolean(phone && phone.trim()))
    ).size;

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
      .sort((a, b) => a.count - b.count || (b.count ? b.resolved / b.count : 0) - (a.count ? a.resolved / a.count : 0))
      .slice(0, 5)
      .map((item, index) => ({
        rank: index + 1,
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
    const thongKeTheoLinhVuc = [...linhVucMap.entries()]
      .map(([name, count]) => ({
        name,
        count,
        percent: currentItems.length ? Number(((count / currentItems.length) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({
        ...item,
        color: colors[index % colors.length],
      }));

    const trendMap = new Map();
    const nowForTrend = new Date();
    currentItems.forEach((item) => {
      if (!item.thoi_gian_tao) return;
      const dateParts = getDatePartsInVietnam(new Date(item.thoi_gian_tao));
      const key = `${dateParts.year}-${String(dateParts.month).padStart(2, "0")}-${String(dateParts.day).padStart(2, "0")}`;
      const date = `${String(dateParts.day).padStart(2, "0")}/${String(dateParts.month).padStart(2, "0")}`;

      const latestStatus = getLatestStatus(item);
      const completedAt = isResolved(item) && latestStatus?.thoi_gian_tao
        ? latestStatus.thoi_gian_tao
        : null;
      const classification = getSlaClassification({
        createdAt: item.thoi_gian_tao,
        deadline: item.ngay_du_kien_hoan_thanh,
        completedAt,
        now: nowForTrend,
      });

      const entry = trendMap.get(key) || {
        key,
        date,
        tongPhanAnh: 0,
        hoanThanh: 0,
        daGiaiQuyet: 0,
        quaHan: 0,
      };
      entry.tongPhanAnh += 1;
      if (isResolved(item)) {
        entry.hoanThanh += 1;
        entry.daGiaiQuyet += 1;
      }
      if (classification === "overdue") {
        entry.quaHan += 1;
      }
      trendMap.set(key, entry);
    });

    const deptMap = new Map();
    (activeLinhVucList || []).forEach((lv) => {
      deptMap.set(lv.ten, {
        name: lv.ten,
        totalAssigned: 0,
        processing: 0,
        completed: 0,
        onTime: 0,
        overdue: 0,
      });
    });

    allScopeItems.forEach((item) => {
      const name = item.linh_vuc_phan_anh?.ten || "Chưa phân loại";
      const entry = deptMap.get(name) || {
        name,
        totalAssigned: 0,
        processing: 0,
        completed: 0,
        onTime: 0,
        overdue: 0,
      };

      entry.totalAssigned += 1;
      const latestStatus = getLatestStatus(item);
      const isItemResolved = isResolved(item) || isClosed(item);
      if (isItemResolved) {
        entry.completed += 1;
      } else {
        entry.processing += 1;
      }

      const completedAt = isResolved(item) && latestStatus?.thoi_gian_tao
        ? latestStatus.thoi_gian_tao
        : null;
      const classification = getSlaClassification({
        createdAt: item.thoi_gian_tao,
        deadline: item.ngay_du_kien_hoan_thanh,
        completedAt,
        now: new Date(),
      });

      if (classification === "overdue") {
        entry.overdue += 1;
      } else {
        entry.onTime += 1;
      }

      deptMap.set(name, entry);
    });

    const hieuSuatDonVi = [...deptMap.values()]
      .sort((a, b) => b.totalAssigned - a.totalAssigned || a.name.localeCompare(b.name))
      .map((dept) => ({
        ...dept,
        rate: dept.totalAssigned ? `${Math.round((dept.onTime / dept.totalAssigned) * 100)}%` : "—",
      }));

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
      tong_tat_ca: totalAllPhanAnh,
      previous_tong_tat_ca: previousAllPhanAnh,
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
      ty_le_xu_ly_theo_khu_pho: [...khuPhoMap.values()]
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .map((item) => ({
          name: item.name,
          rate: item.count ? Number(((item.resolved / item.count) * 100).toFixed(1)) : 0,
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
      xu_huong_phan_anh: [...trendMap.values()]
        .sort((a, b) => a.key.localeCompare(b.key))
        .map(({ date, tongPhanAnh, hoanThanh, daGiaiQuyet, quaHan }) => ({
          date,
          tongPhanAnh,
          hoanThanh,
          daGiaiQuyet,
          quaHan,
        })),
      hieu_suat_don_vi: hieuSuatDonVi,
      current_status: currentStatus,
      previous_status: previousStatus,
      nhat_ky_hoat_dong,
    };
  },

};

export default PhanAnhDashboardRepository;
