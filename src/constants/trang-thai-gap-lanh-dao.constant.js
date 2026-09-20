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
  OVERDUE: "OVERDUE",
});

export const TRANG_THAI_GAP_LANH_DAO_DESC = Object.freeze({
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  IN_PROGRESS: "Đang xử lý",
  REJECTED: "Từ chối",
  CANCELED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
  OVERDUE: "Quá hạn",
});

export const TRANG_THAI_GAP_LANH_DAO_LIST = Object.freeze(
  Object.values(TRANG_THAI_GAP_LANH_DAO)
);

// REJECTED không diễn ra cuộc gặp nên không chiếm sức chứa của ca.
// CANCELED vẫn được giữ chỗ theo nghiệp vụ để ca không được mở lại.
export const TRANG_THAI_GAP_LANH_DAO_GIU_CHO = Object.freeze([
  TRANG_THAI_GAP_LANH_DAO.PENDING,
  TRANG_THAI_GAP_LANH_DAO.APPROVED,
  TRANG_THAI_GAP_LANH_DAO.IN_PROGRESS,
  TRANG_THAI_GAP_LANH_DAO.COMPLETED,
  TRANG_THAI_GAP_LANH_DAO.CANCELED,
]);
