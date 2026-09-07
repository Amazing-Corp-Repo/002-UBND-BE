const PHAN_ANH_MUC_DO = {
  THONG_THUONG: "Thông thường",
  KHAN_CAP: "Khẩn cấp",
};

const LEGACY_NORMAL_MUC_DO = ["Thấp", "Trung bình", "Cao"];

export const normalizePhanAnhMucDo = (mucDo) =>
  LEGACY_NORMAL_MUC_DO.includes(mucDo)
    ? PHAN_ANH_MUC_DO.THONG_THUONG
    : mucDo;

export const getPhanAnhMucDoFilterValues = (mucDo) =>
  mucDo === PHAN_ANH_MUC_DO.THONG_THUONG
    ? [PHAN_ANH_MUC_DO.THONG_THUONG, ...LEGACY_NORMAL_MUC_DO]
    : [mucDo];

export default PHAN_ANH_MUC_DO;
