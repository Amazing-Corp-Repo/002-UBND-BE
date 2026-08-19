/**
 * Trạng thái đăng ký gặp lãnh đạo
 * Dùng VARCHAR + CHECK trong DB, constant này cho BE code dùng
 */
export const TRANG_THAI_GAP_LANH_DAO = Object.freeze({
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
});

export const TRANG_THAI_GAP_LANH_DAO_DESC = Object.freeze({
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  COMPLETED: "Đã hoàn thành",
});

export const TRANG_THAI_GAP_LANH_DAO_LIST = Object.freeze(
  Object.values(TRANG_THAI_GAP_LANH_DAO)
);