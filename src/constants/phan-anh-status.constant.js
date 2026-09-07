const PHAN_ANH_STATUS = {
  DA_GUI: "Đã gửi",
  DANG_XU_LY: "Đang xử lý",
  TU_CHOI: "Từ chối",
  DA_GIAI_QUYET: "Đã giải quyết",
  DONG: "Đóng",
};

const ALLOWED_STATUS_TRANSITIONS = {
  [PHAN_ANH_STATUS.DA_GUI]: [
    PHAN_ANH_STATUS.DANG_XU_LY,
    PHAN_ANH_STATUS.TU_CHOI,
  ],
  [PHAN_ANH_STATUS.DANG_XU_LY]: [PHAN_ANH_STATUS.DA_GIAI_QUYET],
  [PHAN_ANH_STATUS.DA_GIAI_QUYET]: [PHAN_ANH_STATUS.DONG],
  [PHAN_ANH_STATUS.TU_CHOI]: [],
  [PHAN_ANH_STATUS.DONG]: [],
};

export const getAllowedPhanAnhStatusTransitions = (currentStatus) =>
  ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

export default PHAN_ANH_STATUS;
