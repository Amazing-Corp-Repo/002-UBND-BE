export const PERMISSION = {
  // Cơ sở dịch vụ công
  CSV_CREATE: "CSV_CREATE",
  CSV_UPDATE: "CSV_UPDATE",
  CSV_DELETE: "CSV_DELETE",
  CSV_UPDATE_STATUS: "CSV_UPDATE_STATUS",

  // Danh mục tin tức
  DMTT_CREATE: "DMTT_CREATE",
  DMTT_UPDATE: "DMTT_UPDATE",
  DMTT_DELETE: "DMTT_DELETE",
  DMTT_UPDATE_STATUS: "DMTT_UPDATE_STATUS",

  // Lịch tiếp dân
  LTD_CREATE: "LTD_CREATE",
  LTD_UPDATE: "LTD_UPDATE",
  LTD_DELETE: "LTD_DELETE",
  LTD_UPDATE_STATUS: "LTD_UPDATE_STATUS",
  LTD_GET_TEMPLATE: "LTD_GET_TEMPLATE",

  // Lĩnh vực phản ánh
  LVPA_CREATE: "LVPA_CREATE",
  LVPA_UPDATE: "LVPA_UPDATE",
  LVPA_DELETE: "LVPA_DELETE",
  LVPA_UPDATE_STATUS: "LVPA_UPDATE_STATUS",

  // Lĩnh vực thủ tục hành chính
  LVTTHC_CREATE: "LVTTHC_CREATE",
  LVTTHC_UPDATE: "LVTTHC_UPDATE",
  LVTTHC_DELETE: "LVTTHC_DELETE",
  LVTTHC_UPDATE_STATUS: "LVTTHC_UPDATE_STATUS",

  // Mẫu đơn
  MD_CREATE: "MD_CREATE",
  MD_UPDATE: "MD_UPDATE",
  MD_DELETE: "MD_DELETE",
  MD_UPDATE_STATUS: "MD_UPDATE_STATUS",

  // Phản ánh
  PA_CREATE: "PA_CREATE",
  PA_UPDATE_STATUS: "PA_UPDATE_STATUS",
  PA_GET_DETAIL: "PA_GET_DETAIL",
  PA_GET_ALL: "PA_GET_ALL",
  PA_THUONG_TRUC: "PA_THUONG_TRUC",

  // Report
  RPT_GET_DETAIL: "RPT_GET_DETAIL",
  RPT_GET_EXCEL: "RPT_GET_EXCEL",

  // Thủ tục hành chính
  TT_CREATE: "TT_CREATE",
  TT_UPDATE: "TT_UPDATE",
  TT_DELETE: "TT_DELETE",
  TT_UPDATE_STATUS: "TT_UPDATE_STATUS",

  // Tin tức
  TTIN_CREATE: "TTIN_CREATE",
  TTIN_UPDATE: "TTIN_UPDATE",
  TTIN_DELETE: "TTIN_DELETE",
  TTIN_UPDATE_STATUS: "TTIN_UPDATE_STATUS",

  // Ủy ban
  UB_CREATE: "UB_CREATE",
  UB_UPDATE: "UB_UPDATE",

  // Người dùng
  ND_CREATE: "ND_CREATE",
  ND_UPDATE: "ND_UPDATE",
  ND_DELETE: "ND_DELETE",
  ND_UPDATE_STATUS: "ND_UPDATE_STATUS",
  ND_GET_DETAIL: "ND_GET_DETAIL",

  // Role
  ROLE_CREATE: "ROLE_CREATE",
  ROLE_UPDATE: "ROLE_UPDATE",
  ROLE_DELETE: "ROLE_DELETE",
  ROLE_UPDATE_STATUS: "ROLE_UPDATE_STATUS",

  // Permission
  PERM_GET_ALL: "PERM_GET_ALL",

  // Audit Log
  ADL_GET_ALL: "ADL_GET_ALL",
  ADL_GET_DETAIL: "ADL_GET_DETAIL",
};

export const PERMISSION_DESC = {
  CSV_CREATE: "Tạo cơ sở dịch vụ công",
  CSV_UPDATE: "Cập nhật cơ sở dịch vụ công",
  CSV_DELETE: "Xóa cơ sở dịch vụ công",
  CSV_UPDATE_STATUS: "Cập nhật trạng thái cơ sở dịch vụ công",

  DMTT_CREATE: "Tạo danh mục tin tức",
  DMTT_UPDATE: "Cập nhật danh mục tin tức",
  DMTT_DELETE: "Xóa danh mục tin tức",
  DMTT_UPDATE_STATUS: "Cập nhật trạng thái danh mục tin tức",

  LTD_CREATE: "Tạo lịch tiếp dân",
  LTD_UPDATE: "Cập nhật lịch tiếp dân",
  LTD_DELETE: "Xóa lịch tiếp dân",
  LTD_UPDATE_STATUS: "Cập nhật trạng thái lịch tiếp dân",
  LTD_GET_TEMPLATE: "Lấy mẫu lịch tiếp dân",

  LVPA_CREATE: "Tạo lĩnh vực phản ánh",
  LVPA_UPDATE: "Cập nhật lĩnh vực phản ánh",
  LVPA_DELETE: "Xóa lĩnh vực phản ánh",
  LVPA_UPDATE_STATUS: "Cập nhật trạng thái lĩnh vực phản ánh",

  LVTTHC_CREATE: "Tạo lĩnh vực thủ tục hành chính",
  LVTTHC_UPDATE: "Cập nhật lĩnh vực thủ tục hành chính",
  LVTTHC_DELETE: "Xóa lĩnh vực thủ tục hành chính",
  LVTTHC_UPDATE_STATUS: "Cập nhật trạng thái lĩnh vực thủ tục hành chính",

  MD_CREATE: "Tạo mẫu đơn",
  MD_UPDATE: "Cập nhật mẫu đơn",
  MD_DELETE: "Xóa mẫu đơn",
  MD_UPDATE_STATUS: "Cập nhật trạng thái mẫu đơn",

  PA_CREATE: "Tạo phản ánh",
  PA_UPDATE_STATUS: "Cập nhật trạng thái phản ánh",
  PA_GET_DETAIL: "Xem chi tiết phản ánh",
  PA_GET_ALL: "Xem tất cả phản ánh",
  PA_THUONG_TRUC: "Thường trực - nhận báo cáo thống kê phản ánh hằng ngày",

  RPT_GET_DETAIL: "Xem báo cáo",
  RPT_GET_EXCEL: "Xuất báo cáo Excel",

  TT_CREATE: "Tạo thủ tục",
  TT_UPDATE: "Cập nhật thủ tục",
  TT_DELETE: "Xóa thủ tục",
  TT_UPDATE_STATUS: "Cập nhật trạng thái thủ tục",

  TTIN_CREATE: "Tạo tin tức",
  TTIN_UPDATE: "Cập nhật tin tức",
  TTIN_DELETE: "Xóa tin tức",
  TTIN_UPDATE_STATUS: "Cập nhật trạng thái tin tức",

  UB_CREATE: "Tạo ủy ban",
  UB_UPDATE: "Cập nhật ủy ban",

  ND_CREATE: "Tạo người dùng",
  ND_UPDATE: "Cập nhật người dùng",
  ND_DELETE: "Xóa người dùng",
  ND_UPDATE_STATUS: "Cập nhật trạng thái người dùng",
  ND_GET_DETAIL: "Xem người dùng",

  ROLE_CREATE: "Tạo vai trò",
  ROLE_UPDATE: "Cập nhật vai trò",
  ROLE_DELETE: "Xóa vai trò",
  ROLE_UPDATE_STATUS: "Cập nhật trạng thái vai trò",

  PERM_GET_ALL: "Xem tất cả quyền",

  ADL_GET_ALL: "Xem nhật ký hệ thống",
  ADL_GET_DETAIL: "Xem chi tiết nhật ký hệ thống",
};

export const PERMISSION_CATEGORIES = {
  CSV: "Cơ sở dịch vụ công",
  DMTT: "Danh mục tin tức",
  LTD: "Lịch tiếp dân",
  LVPA: "Lĩnh vực phản ánh",
  LVTTHC: "Lĩnh vực thủ tục hành chính",
  MD: "Mẫu đơn",
  PA: "Phản ánh",
  RPT: "Báo cáo",
  TT: "Thủ tục hành chính",
  TTIN: "Tin tức",
  UB: "Ủy ban",
  ND: "Người dùng",
  ROLE: "Vai trò",
  PERM: "Quyền",
  ADL: "Nhật ký hệ thống",
};

export const PERMISSION_TYPE = {
  CREATE: "Tạo mới",
  UPDATE: "Thay đổi thông tin",
  DELETE: "Xóa",
  UPDATE_STATUS: "Cập nhật trạng thái",
  GET_TEMPLATE: "Lấy mẫu",
  GET_DETAIL: "Xem chi tiết",
  GET_ALL: "Xem tất cả",
  GET_EXCEL: "Xuất Excel",
  THUONG_TRUC: "Thường trực",
};
