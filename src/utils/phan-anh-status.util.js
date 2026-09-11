import PHAN_ANH_STATUS, { PHAN_ANH_LIFECYCLE_STATUS } from "../constants/phan-anh-status.constant.js";

const API_TO_DB_STATUS = {
  DA_GUI: PHAN_ANH_STATUS.DA_GUI,
  DANG_XU_LY: PHAN_ANH_STATUS.DANG_XU_LY,
  DA_GIAI_QUYET: PHAN_ANH_STATUS.DA_GIAI_QUYET,
  DONG: PHAN_ANH_STATUS.DONG,
  TU_CHOI: PHAN_ANH_STATUS.TU_CHOI,
  DA_GIA_HAN: PHAN_ANH_STATUS.DA_GIA_HAN,
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

// Gia hạn là sự kiện nghiệp vụ/audit, không phải trạng thái vòng đời phản ánh.
// Các response hiển thị cho Web/Mobile luôn phải dùng các helper này thay vì
// lấy phần tử đầu tiên của lịch sử trạng thái.
const isPhanAnhLifecycleStatus = (value) => PHAN_ANH_LIFECYCLE_STATUS.includes(value);

const getPhanAnhLifecycleHistory = (history = []) => (
  Array.isArray(history) ? history.filter((item) => isPhanAnhLifecycleStatus(item?.ten)) : []
);

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
  getPhanAnhLifecycleHistory,
  isPhanAnhLifecycleStatus,
  toApiPhanAnhMucDo,
  toApiPhanAnhStatus,
  toDbPhanAnhMucDo,
  toDbPhanAnhStatus,
};
