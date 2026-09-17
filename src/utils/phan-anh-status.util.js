import PHAN_ANH_STATUS, { PHAN_ANH_LIFECYCLE_STATUS } from "../constants/phan-anh-status.constant.js";

const API_TO_DB_STATUS = {
  DA_GUI: PHAN_ANH_STATUS.DA_GUI,
  DANG_XU_LY: PHAN_ANH_STATUS.DANG_XU_LY,
  DA_GIAI_QUYET: PHAN_ANH_STATUS.DA_GIAI_QUYET,
  DONG: PHAN_ANH_STATUS.DONG,
  TU_CHOI: PHAN_ANH_STATUS.TU_CHOI,
  DA_GIA_HAN: PHAN_ANH_STATUS.DA_GIA_HAN,
  XIN_GIA_HAN: PHAN_ANH_STATUS.XIN_GIA_HAN,
  QUA_HAN: PHAN_ANH_STATUS.QUA_HAN,
};

const DB_TO_API_STATUS = Object.fromEntries(
  Object.entries(API_TO_DB_STATUS).map(([apiStatus, dbStatus]) => [dbStatus, apiStatus]),
);

const toDbPhanAnhStatus = (value) => {
  if (!value) return value;
  return API_TO_DB_STATUS[value] || value;
};

const toApiPhanAnhStatus = (value) => {
  if (!value) return value;
  return DB_TO_API_STATUS[value] || value;
};

// Vòng đời phản ánh chính thống
const isPhanAnhLifecycleStatus = (value) => PHAN_ANH_LIFECYCLE_STATUS.includes(value);

const getPhanAnhLifecycleHistory = (history = []) => (
  Array.isArray(history) ? history.filter((item) => isPhanAnhLifecycleStatus(item?.ten)) : []
);

// Trả về đầy đủ lịch sử cập nhật cho timeline hiển thị công khai và quản trị
const getPhanAnhDisplayHistory = (history = []) => {
  if (!Array.isArray(history)) return [];
  return history.map((item) => {
    const isGiaHan = item?.ten === PHAN_ANH_STATUS.DA_GIA_HAN || item?.is_gia_han === true;
    const isXinGiaHan = item?.ten === PHAN_ANH_STATUS.XIN_GIA_HAN || item?.is_xin_gia_han === true;
    const isQuaHan = item?.ten === PHAN_ANH_STATUS.QUA_HAN || item?.is_qua_han === true;
    return {
      ...item,
      is_gia_han: isGiaHan,
      is_xin_gia_han: isXinGiaHan,
      is_qua_han: isQuaHan,
    };
  });
};

const getLatestPhanAnhLifecycleHistory = (history = []) => getPhanAnhLifecycleHistory(history)
  .reduce((latest, item) => (
    !latest || new Date(item.thoi_gian_tao) > new Date(latest.thoi_gian_tao) ? item : latest
  ), null);


const toDbPhanAnhMucDo = (value) => {
  if (value === "KHAN_CAP") return "Khẩn cấp";
  if (value === "BINH_THUONG") return "Thông thường";
  return value;
};

const toApiPhanAnhMucDo = (value) => {
  if (value === "Khẩn cấp") return "KHAN_CAP";
  if (value === "Thông thường") return "BINH_THUONG";
  return value;
};

export {
  API_TO_DB_STATUS,
  getLatestPhanAnhLifecycleHistory,
  getPhanAnhDisplayHistory,
  getPhanAnhLifecycleHistory,
  isPhanAnhLifecycleStatus,
  toApiPhanAnhMucDo,
  toApiPhanAnhStatus,
  toDbPhanAnhMucDo,
  toDbPhanAnhStatus,
};
