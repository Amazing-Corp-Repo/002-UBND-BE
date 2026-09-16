import PhanAnhRepository from "../repositories/phan-anh.repository.js";
import {
  getChange,
  resolveDashboardPeriod,
  resolveDashboardScope,
} from "../utils/dashboard.util.js";

const PhanAnhDashboardService = {
  async getTongQuanPhanAnh({
    preset = "today",
    startDate,
    endDate,
    khuPho = "all",
    idLinhVuc = "all",
    permissions = [],
    cate = "",
    isInternal = false,
  } = {}) {
    const period = resolveDashboardPeriod({ preset, startDate, endDate });
    const { effectiveLinhVucIds, assignedLinhVucIds, isFullAccess } = resolveDashboardScope({
      permissions: isInternal ? ["PA_THUONG_TRUC"] : permissions,
      cate,
      idLinhVuc,
    });
    const scopedLinhVucIds = isFullAccess ? undefined : assignedLinhVucIds;

    let {
      nhat_ky_hoat_dong,
      tong_so,
      tong_tat_ca,
      previous_tong_tat_ca,
      previous_tong_so,
      tong_hom_nay,
      tong_nguoi_dan,
      current_nguoi_dan,
      previous_nguoi_dan,
      current_ty_le_xu_ly,
      previous_ty_le_xu_ly,
      qua_han,
      khan_cap,
      thong_ke_theo_trang_thai,
      thong_ke_theo_khu_pho,
      top_khu_pho,
      ty_le_xu_ly_theo_khu_pho,
      thong_ke_theo_linh_vuc,
      thong_ke_theo_han_xu_ly,
      xu_huong_phan_anh,
      hieu_suat_don_vi,
    } = await PhanAnhRepository.getTongQuanPhanAnh({
      currentPeriod: period.current,
      previousPeriod: period.previous,
      todayPeriod: period.today,
      khuPho,
      effectiveLinhVucIds,
      scopedLinhVucIds,
    });

    nhat_ky_hoat_dong = nhat_ky_hoat_dong.map((log) => {
      log.is_success = log.response_status_code === 200;
      log.hanh_dong = log.table_name;
      log.table_name = undefined;
      log.response_status_code = undefined;
      return log;
    });

    const nguoiDanChange = getChange(current_nguoi_dan, previous_nguoi_dan);
    const phanAnhChange = getChange(tong_tat_ca, previous_tong_tat_ca ?? previous_tong_so);
    const tyLeXuLyChange = getChange(current_ty_le_xu_ly, previous_ty_le_xu_ly, {
      percentagePoint: true,
    });

    return {
      tong_so,
      tong_tat_ca,
      tong_hom_nay,
      tong_nguoi_dan,
      ty_le_xu_ly: current_ty_le_xu_ly,
      qua_han,
      khan_cap,
      pt_nguoi_dan: nguoiDanChange.value,
      huong_nguoi_dan: nguoiDanChange.direction,
      pt_phan_anh: phanAnhChange.value,
      huong_phan_anh: phanAnhChange.direction,
      pt_ty_le_xu_ly: tyLeXuLyChange.value,
      huong_ty_le_xu_ly: tyLeXuLyChange.direction,
      thong_ke_theo_trang_thai,
      thong_ke_theo_khu_pho,
      top_khu_pho,
      ty_le_xu_ly_theo_khu_pho,
      thong_ke_theo_linh_vuc,
      thong_ke_theo_han_xu_ly,
      xu_huong_phan_anh,
      hieu_suat_don_vi,
      nhat_ky_hoat_dong,
      ky_hien_tai: {
        startDate: period.current.startDate,
        endDate: period.current.endDate,
      },
      ky_doi_chieu: {
        startDate: period.previous.startDate,
        endDate: period.previous.endDate,
      },
    };
  },
};

export default PhanAnhDashboardService;
