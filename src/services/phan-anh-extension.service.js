import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import PHAN_ANH_EXTENSION_STATUS from "../constants/phan-anh-extension-status.constant.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import { PERMISSION } from "../constants/permission.constant.js";
import { getLatestPhanAnhLifecycleHistory, toDbPhanAnhMucDo, toApiPhanAnhMucDo, toApiPhanAnhStatus } from "../utils/phan-anh-status.util.js";
import PhanAnhExtensionRepository from "../repositories/phan-anh-extension.repository.js";
import NotificationRepository from "../repositories/notification.repository.js";
import UserRepository from "../repositories/user.repository.js";
import ExcelJS from "exceljs";

const parseCate = (cate) => String(cate || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const hasExtensionFullAccess = (permissions = []) => [
  PERMISSION.PA_EXTENSION_GET_ALL,
  PERMISSION.PA_EXTENSION_APPROVE,
  PERMISSION.PA_EXTENSION_REJECT,
].some((permission) => Array.isArray(permissions) && permissions.includes(permission));

const mapExtension = (extension) => {
  if (!extension) return extension;
  const complaint = extension.phan_anh;
  return {
    id: extension.id,
    id_phan_anh: extension.id_phan_anh,
    ma_phan_anh: complaint?.ma_phan_anh || null,
    tieu_de_phan_anh: complaint?.tieu_de || null,
    khu_pho: complaint?.khu_pho || null,
    muc_do: toApiPhanAnhMucDo(complaint?.muc_do),
    linh_vuc: complaint?.linh_vuc_phan_anh || null,
    trang_thai_phan_anh: toApiPhanAnhStatus(getLatestPhanAnhLifecycleHistory(complaint?.lich_su_trang_thai)?.ten),
    nguoi_de_nghi: extension.nguoi_de_nghi || null,
    nguoi_duyet: extension.nguoi_duyet || null,
    han_ban_dau: extension.han_ban_dau,
    han_de_xuat_moi: extension.han_de_xuat_moi,
    ly_do_gia_han: extension.ly_do_gia_han,
    ly_do_tu_choi: extension.ly_do_tu_choi,
    trang_thai: extension.trang_thai,
    thoi_gian_de_nghi: extension.thoi_gian_tao,
    thoi_gian_duyet: extension.thoi_gian_duyet,
    files: (extension.de_nghi_gia_han_file || []).map((file) => ({
      id: file.id,
      ten_file: file.ten_file,
      url_file: file.url_file,
      dinh_dang_file: file.dinh_dang_file,
      kich_thuoc_file_mb: file.kich_thuoc_file_mb,
    })),
  };
};

const assertExtensionScope = (extension, permissions, cate) => {
  if (hasExtensionFullAccess(permissions)) return;
  const cateIds = parseCate(cate);
  if (!cateIds.includes(extension.phan_anh?.id_linh_vuc_phan_anh)) {
    throw new BaseError(403, "Bạn không có quyền truy cập đề nghị gia hạn này");
  }
};

const resolveExtensionScope = ({ permissions, cate, idLinhVuc }) => {
  const fullAccess = hasExtensionFullAccess(permissions);
  const cateIds = parseCate(cate);
  if (!fullAccess && idLinhVuc && !cateIds.includes(idLinhVuc)) {
    throw new BaseError(403, "Bạn không có quyền truy cập lĩnh vực phản ánh này");
  }
  return { scopedLinhVucIds: fullAccess ? undefined : cateIds };
};

const formatExcelDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const PhanAnhExtensionService = {
  async create({ complaintId, requestedDeadline, reason, files = [], userId, cate }) {
    const complaint = await PhanAnhExtensionRepository.findComplaintById(complaintId);
    if (!complaint) throw new BaseError(404, "Phản ánh không tồn tại");

    const cateIds = parseCate(cate);
    if (!complaint.id_linh_vuc_phan_anh || !cateIds.includes(complaint.id_linh_vuc_phan_anh)) {
      throw new BaseError(403, "Bạn chỉ được tạo gia hạn cho phản ánh thuộc lĩnh vực quản lý");
    }
    if (!complaint.ngay_du_kien_hoan_thanh) {
      throw new BaseError(400, "Phản ánh chưa có thời hạn xử lý để gia hạn");
    }

    const latestStatus = getLatestPhanAnhLifecycleHistory(complaint.lich_su_trang_thai)?.ten;
    if ([PHAN_ANH_STATUS.DA_GIAI_QUYET, PHAN_ANH_STATUS.DONG, PHAN_ANH_STATUS.TU_CHOI].includes(latestStatus)) {
      throw new BaseError(400, "Không thể gia hạn phản ánh đã kết thúc");
    }

    const proposedDeadline = new Date(requestedDeadline);
    if (proposedDeadline <= new Date(complaint.ngay_du_kien_hoan_thanh)) {
      throw new BaseError(400, "Hạn đề xuất mới phải sau hạn xử lý hiện tại");
    }

    const result = await PhanAnhExtensionRepository.createIfNoPending(
      {
        id_phan_anh: complaintId,
        id_nguoi_de_nghi: userId,
        han_ban_dau: complaint.ngay_du_kien_hoan_thanh,
        han_de_xuat_moi: proposedDeadline,
        ly_do_gia_han: reason,
        trang_thai: PHAN_ANH_EXTENSION_STATUS.PENDING,
      },
      files.map((file) => ({
        ten_file: file.originalname || file.filename,
        url_file: file.relativeUrl,
        dinh_dang_file: file.mimetype,
        kich_thuoc_file_mb: file.sizeMB,
      })),
    );
    if (!result) throw new BaseError(409, "Phản ánh đang có đề nghị gia hạn chờ phê duyệt");

    const approvers = await UserRepository.findActiveUsersByPermissionCode(PERMISSION.PA_EXTENSION_APPROVE);
    await Promise.all(approvers.map((approver) => NotificationRepository.createNotification({
      user_id: approver.id,
      title: "Đề nghị gia hạn phản ánh",
      body: `Có đề nghị gia hạn mới cho phản ánh ${complaint.ma_phan_anh}`,
      target_type: "PHAN_ANH_EXTENSION",
      target_id: result.id,
    })));

    return mapExtension(result);
  },

  async getAll({ status, page, size, search, mucDo, idLinhVuc, permissions, cate }) {
    const { scopedLinhVucIds } = resolveExtensionScope({ permissions, cate, idLinhVuc });
    const result = await PhanAnhExtensionRepository.getList({
      status,
      page,
      size,
      search,
      mucDo: toDbPhanAnhMucDo(mucDo),
      idLinhVuc,
      scopedLinhVucIds,
    });
    return {
      data: result.data.map(mapExtension),
      pagination: createPagination(page, size, result.totalItems),
    };
  },

  async exportExcel({ status, search, mucDo, idLinhVuc, permissions, cate }) {
    const { scopedLinhVucIds } = resolveExtensionScope({ permissions, cate, idLinhVuc });
    const extensions = await PhanAnhExtensionRepository.getAllForExport({
      status,
      search,
      mucDo: toDbPhanAnhMucDo(mucDo),
      idLinhVuc,
      scopedLinhVucIds,
    });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Quản lý gia hạn");
    sheet.columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Mã phản ánh", key: "ma", width: 16 },
      { header: "Tiêu đề phản ánh", key: "tieuDe", width: 38 },
      { header: "Lĩnh vực", key: "linhVuc", width: 25 },
      { header: "Mức độ", key: "mucDo", width: 16 },
      { header: "Trạng thái phản ánh", key: "trangThaiPhanAnh", width: 20 },
      { header: "Hạn ban đầu", key: "hanBanDau", width: 20 },
      { header: "Hạn đề xuất mới", key: "hanMoi", width: 20 },
      { header: "Lý do gia hạn", key: "lyDoGiaHan", width: 42 },
      { header: "Người đề nghị", key: "nguoiDeNghi", width: 24 },
      { header: "Thời gian đề nghị", key: "thoiGianDeNghi", width: 22 },
      { header: "Trạng thái đề nghị", key: "trangThai", width: 18 },
      { header: "Người duyệt", key: "nguoiDuyet", width: 24 },
      { header: "Thời gian duyệt", key: "thoiGianDuyet", width: 22 },
      { header: "Lý do từ chối", key: "lyDoTuChoi", width: 42 },
    ];
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });
    extensions.map(mapExtension).forEach((item, index) => {
      const row = sheet.addRow({
        stt: index + 1,
        ma: item.ma_phan_anh,
        tieuDe: item.tieu_de_phan_anh,
        linhVuc: item.linh_vuc?.ten || "",
        mucDo: item.muc_do,
        trangThaiPhanAnh: item.trang_thai_phan_anh,
        hanBanDau: formatExcelDateTime(item.han_ban_dau),
        hanMoi: formatExcelDateTime(item.han_de_xuat_moi),
        lyDoGiaHan: item.ly_do_gia_han,
        nguoiDeNghi: item.nguoi_de_nghi?.ho_va_ten || item.nguoi_de_nghi?.email || "",
        thoiGianDeNghi: formatExcelDateTime(item.thoi_gian_de_nghi),
        trangThai: item.trang_thai,
        nguoiDuyet: item.nguoi_duyet?.ho_va_ten || item.nguoi_duyet?.email || "",
        thoiGianDuyet: formatExcelDateTime(item.thoi_gian_duyet),
        lyDoTuChoi: item.ly_do_tu_choi,
      });
      row.eachCell((cell) => {
        cell.alignment = { vertical: "top", wrapText: true };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" },
        };
      });
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    return workbook.xlsx.writeBuffer();
  },

  async getById(id, { permissions, cate }) {
    const result = await PhanAnhExtensionRepository.getById(id);
    if (!result) throw new BaseError(404, "Đề nghị gia hạn không tồn tại");
    assertExtensionScope(result, permissions, cate);
    return mapExtension(result);
  },

  async approve(id, userId, ghiChu) {
    const result = await PhanAnhExtensionRepository.approve(id, userId, ghiChu);
    if (!result) throw new BaseError(400, "Đề nghị gia hạn không tồn tại hoặc không còn chờ phê duyệt");
    const extension = await PhanAnhExtensionRepository.getById(id);
    await NotificationRepository.createNotification({
      user_id: extension.id_nguoi_de_nghi,
      title: "Đề nghị gia hạn đã được phê duyệt",
      body: `Đề nghị gia hạn cho phản ánh ${result.complaintCode} đã được phê duyệt`,
      target_type: "PHAN_ANH_EXTENSION",
      target_id: id,
    });
    return mapExtension(extension);
  },

  async reject(id, userId, lyDoTuChoi) {
    const result = await PhanAnhExtensionRepository.reject(id, userId, lyDoTuChoi);
    if (!result) throw new BaseError(400, "Đề nghị gia hạn không tồn tại hoặc không còn chờ phê duyệt");
    const extension = await PhanAnhExtensionRepository.getById(id);
    await NotificationRepository.createNotification({
      user_id: extension.id_nguoi_de_nghi,
      title: "Đề nghị gia hạn bị từ chối",
      body: `Đề nghị gia hạn cho phản ánh ${result.complaintCode} đã bị từ chối`,
      target_type: "PHAN_ANH_EXTENSION",
      target_id: id,
    });
    if (result.complaint?.nguoi_tao) {
      await NotificationRepository.createNotification({
        user_id: result.complaint.nguoi_tao,
        title: "Cập nhật trạng thái phản ánh",
        body: `Phản ánh của bạn với mã ${result.complaintCode} đã được cập nhật trạng thái: ${PHAN_ANH_STATUS.DONG}`,
        target_type: "PHAN_ANH",
        target_id: result.complaintCode,
      });
    }
    return mapExtension(extension);
  },
};

export default PhanAnhExtensionService;
