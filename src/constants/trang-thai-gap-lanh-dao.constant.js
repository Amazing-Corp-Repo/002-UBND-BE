/**
 * Trạng thái đăng ký gặp lãnh đạo
 * Dùng VARCHAR + CHECK trong DB, constant này cho BE code dùng
 */
export const TRANG_THAI_GAP_LANH_DAO = Object.freeze({
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  IN_PROGRESS: "IN_PROGRESS",
  REJECTED: "REJECTED",
  CANCELED: "CANCELED",
  COMPLETED: "COMPLETED",
});

export const TRANG_THAI_GAP_LANH_DAO_DESC = Object.freeze({
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  IN_PROGRESS: "Đang xử lý",
  REJECTED: "Từ chối",
  CANCELED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
});

export const TRANG_THAI_GAP_LANH_DAO_LIST = Object.freeze(
  Object.values(TRANG_THAI_GAP_LANH_DAO)
);
