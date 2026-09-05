import DINH_KEM_LOAI from "../constants/dinh-kem-loai.constant.js";
import { normalizePhanAnhMucDo } from "../constants/phan-anh-muc-do.constant.js";

export const enrichPhanAnhResponse = (phanAnh) => {
  if (!phanAnh) return phanAnh;

  const attachments = Array.isArray(phanAnh.dinh_kem_phan_anh)
    ? phanAnh.dinh_kem_phan_anh
    : [];
  const resolutionVideos = Array.isArray(phanAnh.videos_giai_quyet)
    ? phanAnh.videos_giai_quyet
    : [];
  const history = Array.isArray(phanAnh.lich_su_trang_thai)
    ? phanAnh.lich_su_trang_thai
    : [];

  return {
    ...phanAnh,
    muc_do: normalizePhanAnhMucDo(phanAnh.muc_do),
    trang_thai: history[0]?.ten ?? phanAnh.trang_thai ?? null,
    danh_sach_file_phan_anh: attachments.filter(
      (file) => file.loai === DINH_KEM_LOAI.PHAN_ANH || !file.loai,
    ),
    danh_sach_file_giai_quyet: attachments.filter(
      (file) => file.loai === DINH_KEM_LOAI.GIAI_QUYET,
    ),
    video_giai_quyet: resolutionVideos[0] ?? null,
  };
};

export const enrichPhanAnhResponses = (phanAnhOrList) =>
  Array.isArray(phanAnhOrList)
    ? phanAnhOrList.map(enrichPhanAnhResponse)
    : enrichPhanAnhResponse(phanAnhOrList);

export const toPublicPhanAnhResponse = (phanAnh) => {
  const enriched = enrichPhanAnhResponse(phanAnh);
  if (!enriched) return enriched;

  return {
    ma_phan_anh: enriched.ma_phan_anh,
    tieu_de: enriched.tieu_de,
    mo_ta: enriched.mo_ta,
    muc_do: enriched.muc_do,
    vi_tri: enriched.vi_tri,
    khu_pho: enriched.khu_pho,
    mo_ta_vi_tri: enriched.mo_ta_vi_tri,
    ten_nguoi_phan_anh: enriched.ten_nguoi_phan_anh,
    thoi_gian_tao: enriched.thoi_gian_tao,
    thoi_gian_tiep_nhan: enriched.thoi_gian_tiep_nhan,
    thoi_gian_phan_hoi_du_kien: enriched.thoi_gian_phan_hoi_du_kien,
    ngay_du_kien_hoan_thanh: enriched.ngay_du_kien_hoan_thanh,
    trang_thai: enriched.trang_thai,
    linh_vuc_phan_anh: enriched.linh_vuc_phan_anh,
    to_phu_trach: enriched.to_phu_trach
      ? { ho_va_ten: enriched.to_phu_trach.ho_va_ten }
      : null,
    lich_su_trang_thai: enriched.lich_su_trang_thai,
    dinh_kem_phan_anh: enriched.dinh_kem_phan_anh,
    danh_sach_file_phan_anh: enriched.danh_sach_file_phan_anh,
    danh_sach_file_giai_quyet: enriched.danh_sach_file_giai_quyet,
    videos: enriched.videos,
    videos_giai_quyet: enriched.videos_giai_quyet,
    video_giai_quyet: enriched.video_giai_quyet,
  };
};
