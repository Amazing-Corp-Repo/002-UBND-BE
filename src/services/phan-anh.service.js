import PHAN_ANH_STATUS, { PHAN_ANH_LIFECYCLE_STATUS } from "../constants/phan-anh-status.constant.js";
import LinhVucPhanAnhRepository from "../repositories/linh-vuc-phan-anh.repository.js";
import PhanAnhRepository from "../repositories/phan-anh.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import {
  capitalizeWords,
  generateUniqueCode,
  parseCommaString,
} from "../utils/string.util.js";
import UserRepository from "../repositories/user.repository.js";
import PHAN_ANH_MUC_DO from "../constants/phan-anh-muc-do.constant.js";
import ExcelJS from "exceljs";
import { getIO } from "../realtime/socket/index.js";
import adminFirebase from "../realtime/firebase/index.js";
import NotificationRepository from "../repositories/notification.repository.js";
import env from "../config/environment.config.js";
import MailService from "./mail.service.js";
import MAIL_TYPE from "../constants/mail.constant.js";
import DINH_KEM_LOAI from "../constants/dinh-kem-loai.constant.js";
import ExpoNotiRepository from "../repositories/http/expo-noti.repository.js";
import { PERMISSION } from "../constants/permission.constant.js";
import {
  getChange,
  getSlaClassification,
  resolveDashboardPeriod,
  resolveDashboardScope,
} from "../utils/dashboard.util.js";
import {
  toApiPhanAnhMucDo,
  toApiPhanAnhStatus,
  toDbPhanAnhMucDo,
  toDbPhanAnhStatus,
  getLatestPhanAnhLifecycleHistory,
  getPhanAnhLifecycleHistory,
} from "../utils/phan-anh-status.util.js";

const ORDER = [
  PHAN_ANH_STATUS.DA_GUI,
  PHAN_ANH_STATUS.DANG_XU_LY,
  PHAN_ANH_STATUS.DA_GIAI_QUYET,
];

const URL_PHAN_ANH_MANAGER = env.URL_PHAN_ANH_MANAGER;
const URL_PHAN_ANH_USER = env.URL_PHAN_ANH_USER;

const EXCEL_COLUMN_MAP = {
  index: { header: "STT", width: 8, value: (_, index) => index + 1 },
  ma_phan_anh: { header: "Mã phản ánh", width: 16, value: (item) => item.ma_phan_anh || "" },
  tieu_de: { header: "Tiêu đề phản ánh", width: 35, value: (item) => item.tieu_de || "" },
  khu_pho: { header: "Khu phố", width: 14, value: (item) => item.khu_pho || "" },
  linh_vuc_phan_anh: { header: "Lĩnh vực", width: 24, value: (item) => item.linh_vuc_phan_anh?.ten || "" },
  muc_do: { header: "Mức độ", width: 16, value: (item) => item.muc_do || "" },
  lich_su_trang_thai: { header: "Trạng thái", width: 18, value: (item) => getLatestPhanAnhLifecycleHistory(item.lich_su_trang_thai)?.ten || "" },
  thoi_gian_tao: { header: "Ngày gửi", width: 20, value: (item) => formatExcelDateTime(item.thoi_gian_tao) },
  han_xu_ly: { header: "Hạn xử lý (SLA)", width: 20, value: (item) => formatExcelDateTime(item.ngay_du_kien_hoan_thanh) || "-" },
  thong_tin_lien_he: {
    header: "Thông tin người gửi",
    width: 30,
    value: (item) => [item.ten_nguoi_phan_anh, item.sdt_nguoi_phan_anh].filter(Boolean).join(" - "),
  },
  sla_status: { header: "TÌNH TRẠNG", width: 18, value: (item) => getExcelSlaLabel(item) },
};

const formatExcelDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.hour}:${parts.minute} ${parts.day}/${parts.month}/${parts.year}`;
};

const getExcelSlaLabel = (item) => {
  const history = item.lich_su_trang_thai || [];
  const latestStatus = getLatestPhanAnhLifecycleHistory(history);
  const completedAt = latestStatus?.ten === PHAN_ANH_STATUS.DA_GIAI_QUYET
    ? latestStatus.thoi_gian_tao
    : null;
  const classification = getSlaClassification({
    createdAt: item.thoi_gian_tao,
    deadline: item.ngay_du_kien_hoan_thanh,
    completedAt,
  });
  return {
    onTime: "Còn hạn",
    soon: "Sắp đến hạn",
    overdue: "Quá hạn",
    unknown: "Chưa có hạn",
  }[classification] || "Chưa có hạn";
};

const resolvePhanAnhScope = ({ payload, selectedLinhVuc }) => {
  const permissions = Array.isArray(payload?.permissions) ? payload.permissions : [];
  const isFullAccess = permissions.includes(PERMISSION.PA_THUONG_TRUC);
  const cate = parseCommaString(payload?.cate) || [];
  if (!isFullAccess && selectedLinhVuc && !cate.includes(selectedLinhVuc.trim())) {
    throw new BaseError(403, "Bạn không có quyền truy cập lĩnh vực phản ánh này");
  }
  return {
    selectedLinhVuc,
    scopedLinhVucIds: isFullAccess ? undefined : cate,
  };
};

const PhanAnhService = {
  async createPhanAnh(
    idLinhVucPhanAnh,
    tieuDe,
    moTa,
    viTri,
    mucDo,
    tenNguoiPhanAnh,
    soDienThoaiNguoiPhanAnh,
    khuPho,
    moTaViTri,
    userId,
    file,
    idVideo = [],
  ) {
    const hasFile = Array.isArray(file) && file.length > 0;
    const hasVideo = Array.isArray(idVideo) && idVideo.length > 0;
    if (!hasFile && !hasVideo) {
      throw new BaseError(400, "Phải đính kèm ít nhất một ảnh hoặc video");
    }
    const existingLinhVuc =
      await LinhVucPhanAnhRepository.findById(idLinhVucPhanAnh);

    if (!existingLinhVuc || existingLinhVuc.is_active === false) {
      throw new BaseError(400, "Lĩnh vực phản ánh không tồn tại");
    }

    tieuDe = capitalizeWords(tieuDe);
    tenNguoiPhanAnh = tenNguoiPhanAnh ? capitalizeWords(tenNguoiPhanAnh) : "";

    let data = {
      id_linh_vuc_phan_anh: idLinhVucPhanAnh,
      tieu_de: tieuDe,
      mo_ta: moTa,
      vi_tri: viTri,
      muc_do: mucDo,
      ten_nguoi_phan_anh: tenNguoiPhanAnh,
      sdt_nguoi_phan_anh: soDienThoaiNguoiPhanAnh,
      khu_pho: khuPho,
      mo_ta_vi_tri: moTaViTri || null,
      id_video: idVideo,
      id_video_giai_quyet: [],
      // Phản ánh khẩn cấp phải được cán bộ xem xét, không tự động duyệt.
      is_approve: mucDo !== PHAN_ANH_MUC_DO.KHAN_CAP,
    };

    if (userId != null && userId !== "") {
      const existingPhanAnh = await UserRepository.findById(userId);
      if (!existingPhanAnh) {
        throw new BaseError(400, "Người dùng không tồn tại");
      }
      data.nguoi_tao = userId;
    }

    let maPhanAnh = generateUniqueCode();

    data.ma_phan_anh = maPhanAnh;

    const attachments = (file || []).map((f) => ({
      dinh_dang_file: f.mimetype,
      url_file: f.relativeUrl,
      kich_thuoc_file_mb: f.sizeMB,
      loai: DINH_KEM_LOAI.PHAN_ANH,
    }));

    const { createdPhanAnh, trangThai } =
      await PhanAnhRepository.createWithInitialState(
        data,
        { ten: PHAN_ANH_STATUS.DA_GUI },
        attachments,
      );

    let managerMailList =
      await LinhVucPhanAnhRepository.getManagerEmailsByLinhVucId(
        idLinhVucPhanAnh,
      );

    let allAdmin = await UserRepository.getAllAdmin();

    let bcc = [...allAdmin, ...managerMailList];

    const uniqueEmails = [...new Set(bcc)];

    let res = {
      id_phan_anh: createdPhanAnh.id,
      ma_phan_anh: createdPhanAnh.ma_phan_anh,
      tieu_de: createdPhanAnh.tieu_de,
      mo_ta: createdPhanAnh.mo_ta,
      vi_tri: createdPhanAnh.vi_tri,
      muc_do: createdPhanAnh.muc_do,
      ten_nguoi_phan_anh: createdPhanAnh.ten_nguoi_phan_anh,
      sdt_nguoi_phan_anh: createdPhanAnh.sdt_nguoi_phan_anh,
      khu_pho: createdPhanAnh.khu_pho,
      mo_ta_vi_tri: createdPhanAnh.mo_ta_vi_tri,
      trang_thai: trangThai.ten,
      nguoi_tao: createdPhanAnh.nguoi_tao,
      hinh_anh_dinh_kems: (file || []).map((f) => ({
        dinh_dang_file: f.mimetype,
        url_file: f.relativeUrl,
        kich_thuoc_file_mb: f.sizeMB,
      })),
    };

    const safeUrl = (base, id) => {
      if (!base) return null;
      return `${base}/${id}`;
    };

    const url = safeUrl(URL_PHAN_ANH_MANAGER, createdPhanAnh.id);

    let mailData = {
      maPhanAnh: createdPhanAnh.ma_phan_anh,
      tieuDe: createdPhanAnh.tieu_de,
      moTa: createdPhanAnh.mo_ta,
      mucDo: createdPhanAnh.muc_do,
      viTri: createdPhanAnh.vi_tri,
    };

    if (url) {
      mailData.url = url;
    }

    await MailService.sendMailCC({
      bcc: uniqueEmails,
      type: MAIL_TYPE.CREATE_PHAN_ANH,
      data: mailData,
    });

    return res;
  },

  async getPhanAnhByMaPhanAnh(maPhanAnh) {
    if (maPhanAnh === null || maPhanAnh === undefined) {
      throw new BaseError(400, "Mã phản ánh không được để trống");
    }
    let phanAnh = await PhanAnhRepository.getPhanAnhByMaPhanAnh(maPhanAnh);
    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }
    const latestApprovedExtension = phanAnh.de_nghi_gia_han_phan_anh?.[0] || null;
    // Không công khai event "Đã gia hạn" trong danh sách trạng thái. Thông tin
    // gia hạn vẫn được trả riêng để UI có thể hiển thị hạn/lý do, không biến nó
    // thành trạng thái thứ sáu.
    phanAnh.lich_su_trang_thai = getPhanAnhLifecycleHistory(phanAnh.lich_su_trang_thai)
      .map(({ ten, thoi_gian_tao }) => ({ ten, thoi_gian_tao }));
    phanAnh.thong_tin_gia_han = latestApprovedExtension
      ? {
          han_xu_ly_moi: phanAnh.ngay_du_kien_hoan_thanh,
          ly_do_gia_han: latestApprovedExtension.ly_do_gia_han,
          thoi_gian_duyet: latestApprovedExtension.thoi_gian_duyet,
        }
      : null;
    delete phanAnh.de_nghi_gia_han_phan_anh;
    return phanAnh;
  },

  async getAll(
    idLinhVucPhanAnh,
    trangThai,
    mucDo,
    maPhanAnh,
    page,
    size,
    sortTime,
    payload,
    sortBy,
    sortOrder,
    filters = {},
  ) {
    const selectedLinhVuc = filters.idLinhVuc || idLinhVucPhanAnh || null;
    const scope = resolvePhanAnhScope({
      payload,
      selectedLinhVuc,
    });

    const period = filters.startDate && filters.endDate
      ? resolveDashboardPeriod({ preset: "custom", startDate: filters.startDate, endDate: filters.endDate }).current
      : null;
    const result = await PhanAnhRepository.getAllScoped({
      idLinhVucPhanAnh: scope.selectedLinhVuc,
      trangThai: toDbPhanAnhStatus(trangThai),
      mucDo: toDbPhanAnhMucDo(mucDo),
      maPhanAnh,
      search: filters.search,
      khuPho: filters.khuPho,
      start: period?.start,
      end: period?.end,
      scopedLinhVucIds: scope.scopedLinhVucIds,
      page,
      size,
      sortTime,
      sortBy,
      sortOrder,
    });

    return {
      data: result.data.map((item) => ({
        ...item,
        lich_su_trang_thai: getPhanAnhLifecycleHistory(item.lich_su_trang_thai),
        linh_vuc: item.linh_vuc_phan_anh || null,
        trang_thai_hien_tai: toApiPhanAnhStatus(getLatestPhanAnhLifecycleHistory(item.lich_su_trang_thai)?.ten),
        muc_do_code: toApiPhanAnhMucDo(item.muc_do),
      })),
      pagination: createPagination(page, size, result.totalItems),
    };
  },

  async exportPhanAnhExcel({
    columns,
    search,
    trangThai,
    idLinhVucPhanAnh,
    khuPho,
    mucDo,
    startDate,
    endDate,
    sortTime,
    payload,
  }) {
    const scope = resolvePhanAnhScope({
      payload,
      selectedLinhVuc: idLinhVucPhanAnh || null,
    });
    const period = startDate && endDate
      ? resolveDashboardPeriod({ preset: "custom", startDate, endDate }).current
      : null;
    const items = await PhanAnhRepository.getAllForExcelExport({
      idLinhVucPhanAnh: scope.selectedLinhVuc,
      trangThai: toDbPhanAnhStatus(trangThai),
      mucDo: toDbPhanAnhMucDo(mucDo),
      search,
      khuPho,
      start: period?.start,
      end: period?.end,
      scopedLinhVucIds: scope.scopedLinhVucIds,
      sortTime,
    });

    const columnDefs = columns.map((key) => EXCEL_COLUMN_MAP[key]);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Danh sách Phản ánh");
    sheet.columns = columnDefs.map((column) => ({
      header: column.header,
      width: column.width,
    }));

    const header = sheet.getRow(1);
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" },
      };
    });

    items.forEach((item, index) => {
      const row = sheet.addRow(columnDefs.map((column) => column.value(item, index)));
      row.eachCell((cell) => {
        cell.alignment = { vertical: "top", wrapText: true };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" },
        };
      });
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    return await workbook.xlsx.writeBuffer();
  },

  async getLichSuTrangThaiPhanAnhPublic(maPhanAnh) {
    const phanAnh = await this.getPhanAnhByMaPhanAnh(maPhanAnh);
    return phanAnh.lich_su_trang_thai || [];
  },

  async getLichSuTrangThaiPhanAnh(idPhanAnh, payload) {
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }
    const phanAnh = await PhanAnhRepository.getById(idPhanAnh);
    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }
    resolvePhanAnhScope({
      payload,
      selectedLinhVuc: phanAnh.id_linh_vuc_phan_anh,
    });
    return getPhanAnhLifecycleHistory(await PhanAnhRepository.getLichSuTrangThaiPhanAnh(idPhanAnh));
  },

  async getPhanAnhByUserId(userId, sortTime) {
    if (userId === null || userId === undefined) {
      throw new BaseError(400, "ID người dùng không được để trống");
    }
    const phanAnhs = await PhanAnhRepository.getPhanAnhByUserId(userId, sortTime);
    return phanAnhs.map((phanAnh) => ({
      ...phanAnh,
      lich_su_trang_thai: getPhanAnhLifecycleHistory(phanAnh.lich_su_trang_thai),
    }));
  },

  getMucDoPhanAnh() {
    return PHAN_ANH_MUC_DO;
  },

  getTrangThaiPhanAnh() {
    return Object.fromEntries(
      Object.entries(PHAN_ANH_STATUS).filter(([, value]) => PHAN_ANH_LIFECYCLE_STATUS.includes(value)),
    );
  },

  async getPhanAnhById(idPhanAnh, payload) {
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }
    let phanAnh = await PhanAnhRepository.getById(idPhanAnh);
    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }

    resolvePhanAnhScope({
      payload,
      selectedLinhVuc: phanAnh.id_linh_vuc_phan_anh,
    });

    // Phản ánh từ tài khoản không nhập tay tên/SĐT → lấy từ thông tin người gửi.
    const nguoiGui = phanAnh.nguoi_dung_phan_anh_nguoi_taoTonguoi_dung;
    if (nguoiGui) {
      if (!phanAnh.ten_nguoi_phan_anh) {
        phanAnh.ten_nguoi_phan_anh =
          nguoiGui.ho_va_ten || nguoiGui.ten_dang_nhap || null;
      }
      if (!phanAnh.sdt_nguoi_phan_anh) {
        phanAnh.sdt_nguoi_phan_anh = nguoiGui.so_dien_thoai || null;
      }
    }
    delete phanAnh.nguoi_dung_phan_anh_nguoi_taoTonguoi_dung;

    // API chi tiết Web cũng chỉ trả trạng thái vòng đời. "Đã gia hạn" được
    // lưu để audit nội bộ nhưng không được trở thành badge/timeline status.
    phanAnh.lich_su_trang_thai = getPhanAnhLifecycleHistory(phanAnh.lich_su_trang_thai);

    return phanAnh;
  },

  async updateStatusPhanAnh(
    idPhanAnh,
    trangThai,
    ghiChu,
    currentUser,
    file,
    idVideoGiaiQuyet = [],
  ) {
    trangThai = toDbPhanAnhStatus(trangThai);
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }
    let phanAnh = await PhanAnhRepository.getById(idPhanAnh);

    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }
    const lastStatus = getLatestPhanAnhLifecycleHistory(phanAnh.lich_su_trang_thai)?.ten;
    if (
      lastStatus === PHAN_ANH_STATUS.DA_GIAI_QUYET ||
      lastStatus === PHAN_ANH_STATUS.DONG ||
      lastStatus === PHAN_ANH_STATUS.TU_CHOI
    ) {
      throw new BaseError(
        400,
        "Không thể cập nhật trạng thái cho phản ánh đã được giải quyết hoặc đóng",
      );
    }
    if (trangThai === PHAN_ANH_STATUS.TU_CHOI) {
      if (lastStatus !== PHAN_ANH_STATUS.DA_GUI) {
        throw new BaseError(400, "Chỉ được từ chối phản ánh ở trạng thái Đã gửi");
      }
    } else if (trangThai !== PHAN_ANH_STATUS.DONG) {
      const currentIndex = ORDER.indexOf(lastStatus);
      const nextIndex = ORDER.indexOf(trangThai);

      if (nextIndex === -1 || currentIndex === -1) {
        throw new BaseError(400, "Trạng thái không hợp lệ");
      }

      if (nextIndex !== currentIndex + 1) {
        throw new BaseError(
          400,
          `Trạng thái tiếp theo phải là: ${ORDER[currentIndex + 1]}`,
        );
      }
    }

    let existingUser = await UserRepository.findById(currentUser);
    if (!existingUser) {
      throw new BaseError(400, "Người dùng không tồn tại");
    }

    // Bắt buộc đính kèm ≥1 ảnh HOẶC ≥1 video hiện trường khi chuyển "Đã giải quyết".
    const uploadedFiles = Array.isArray(file) ? file : [];
    const videoGiaiQuyet = Array.isArray(idVideoGiaiQuyet)
      ? idVideoGiaiQuyet.filter(Boolean)
      : [];
    if (
      trangThai === PHAN_ANH_STATUS.DA_GIAI_QUYET &&
      uploadedFiles.length === 0 &&
      videoGiaiQuyet.length === 0
    ) {
      throw new BaseError(
        400,
        "Phải đính kèm ít nhất 1 ảnh hoặc video hiện trường khi giải quyết phản ánh",
      );
    }
    const dinhKemGiaiQuyet = uploadedFiles.map((f) => ({
      dinh_dang_file: f.mimetype,
      url_file: f.relativeUrl,
      kich_thuoc_file_mb: f.sizeMB,
      loai: DINH_KEM_LOAI.GIAI_QUYET,
    }));

    const phanAnhPatch = {
      nguoi_cap_nhat: currentUser,
      thoi_gian_tiep_nhan:
        trangThai === PHAN_ANH_STATUS.DANG_XU_LY
          ? new Date().toISOString()
          : phanAnh.thoi_gian_tiep_nhan,
      // Lưu video hiện trường đã xử lý (nếu có) — tách riêng với id_video của công dân.
      ...(videoGiaiQuyet.length > 0 && {
        id_video_giai_quyet: videoGiaiQuyet,
      }),
    };

    const historyData = {
      ten: trangThai,
      ghi_chu: ghiChu,
      nguoi_tao: currentUser,
    };

    await PhanAnhRepository.updateStatusWithHistory(
      idPhanAnh,
      phanAnhPatch,
      historyData,
      dinhKemGiaiQuyet,
    );

    if (phanAnh.nguoi_tao) {
      await NotificationRepository.createNotification({
        user_id: phanAnh.nguoi_tao,
        body: `Phản ánh của bạn với mã ${phanAnh.ma_phan_anh} đã được cập nhật trạng thái: ${trangThai}`,
        target_id: phanAnh.ma_phan_anh,
        target_type: "PHAN_ANH",
        title: "Cập nhật trạng thái phản ánh",
      });
    }

    let managerMailList =
      await LinhVucPhanAnhRepository.getManagerEmailsByLinhVucId(
        phanAnh.id_linh_vuc_phan_anh,
      );

    await handleSendMailNotification(
      phanAnh,
      trangThai,
      ghiChu,
      phanAnh.nguoi_tao,
      managerMailList,
    );

    await handleSendNotificationByExpo(
      phanAnh,
      trangThai,
      ghiChu,
      phanAnh.nguoi_tao,
    );
  },

  async updateLinhVucPhanAnh(idPhanAnh, idLinhVucPhanAnh, lyDo, currentUser) {
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }
    if (idLinhVucPhanAnh === null || idLinhVucPhanAnh === undefined) {
      throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
    }

    const phanAnh = await PhanAnhRepository.getById(idPhanAnh);
    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }

    const lastStatus = getLatestPhanAnhLifecycleHistory(phanAnh.lich_su_trang_thai)?.ten;
    if (
      lastStatus === PHAN_ANH_STATUS.DA_GIAI_QUYET ||
      lastStatus === PHAN_ANH_STATUS.DONG
    ) {
      throw new BaseError(
        400,
        "Không thể cập nhật lĩnh vực cho phản ánh đã được giải quyết hoặc đóng",
      );
    }

    if (phanAnh.id_linh_vuc_phan_anh === idLinhVucPhanAnh) {
      throw new BaseError(
        400,
        "Lĩnh vực phản ánh mới phải khác lĩnh vực hiện tại",
      );
    }

    const existingLinhVuc =
      await LinhVucPhanAnhRepository.findById(idLinhVucPhanAnh);
    if (!existingLinhVuc || existingLinhVuc.is_active === false) {
      throw new BaseError(400, "Lĩnh vực phản ánh không tồn tại");
    }

    const existingUser = await UserRepository.findById(currentUser);
    if (!existingUser) {
      throw new BaseError(400, "Người dùng không tồn tại");
    }

    const tenLinhVucCu = phanAnh.linh_vuc_phan_anh?.ten || "lĩnh vực cũ";

    // Đổi lĩnh vực + ghi lịch sử kèm lý do (giữ ten = trạng thái hiện tại để
    // không phá luồng trạng thái tuyến tính). Atomic trong 1 transaction.
    return await PhanAnhRepository.updateLinhVucWithHistory(
      idPhanAnh,
      {
        id_linh_vuc_phan_anh: idLinhVucPhanAnh,
        nguoi_cap_nhat: currentUser,
        thoi_gian_cap_nhat: new Date().toISOString(),
      },
      {
        ten: lastStatus,
        ghi_chu: `Chuyển lĩnh vực từ "${tenLinhVucCu}" sang "${existingLinhVuc.ten}". Lý do: ${lyDo}`,
        nguoi_tao: currentUser,
      },
    );
  },

  async updateMucDoPhanAnh(idPhanAnh, mucDo, lyDo, currentUser) {
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }

    mucDo = toDbPhanAnhMucDo(mucDo);
    const phanAnh = await PhanAnhRepository.getById(idPhanAnh);
    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }
    resolvePhanAnhScope({
      payload,
      selectedLinhVuc: phanAnh.id_linh_vuc_phan_anh,
    });

    const lastStatus = getLatestPhanAnhLifecycleHistory(phanAnh.lich_su_trang_thai)?.ten;
    if ([PHAN_ANH_STATUS.DA_GIAI_QUYET, PHAN_ANH_STATUS.DONG, PHAN_ANH_STATUS.TU_CHOI].includes(lastStatus)) {
      throw new BaseError(400, "Không thể đổi mức độ cho phản ánh đã kết thúc");
    }
    if (phanAnh.muc_do === mucDo) {
      throw new BaseError(400, "Mức độ phản ánh mới phải khác mức độ hiện tại");
    }

    const existingUser = await UserRepository.findById(currentUser);
    if (!existingUser) {
      throw new BaseError(400, "Người dùng không tồn tại");
    }

    // Đổi mức độ không làm thay đổi is_approve: phản ánh khẩn cấp vẫn chỉ được
    // duyệt bởi luồng phê duyệt riêng, tránh phát sinh phê duyệt ngầm.
    return await PhanAnhRepository.updateMucDoWithHistory(
      idPhanAnh,
      {
        muc_do: mucDo,
        nguoi_cap_nhat: currentUser,
        thoi_gian_cap_nhat: new Date().toISOString(),
      },
      {
        ten: lastStatus || PHAN_ANH_STATUS.DA_GUI,
        ghi_chu: `Đổi mức độ từ "${phanAnh.muc_do || "chưa xác định"}" sang "${mucDo}". Lý do: ${lyDo}`,
        nguoi_tao: currentUser,
      },
    );
  },

  async getAssignableUsers(idPhanAnh) {
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }
    const phanAnh = await PhanAnhRepository.getById(idPhanAnh);
    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }
    if (!phanAnh.id_linh_vuc_phan_anh) {
      return [];
    }
    return await LinhVucPhanAnhRepository.getManagersByLinhVucId(
      phanAnh.id_linh_vuc_phan_anh,
    );
  },

  async assignPhanAnh(idPhanAnh, idNguoiXuLy, lyDo, currentUser) {
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }
    if (!idNguoiXuLy) {
      throw new BaseError(400, "Chuyên viên xử lý không được để trống");
    }

    const phanAnh = await PhanAnhRepository.getById(idPhanAnh);
    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }

    const lastStatus = getLatestPhanAnhLifecycleHistory(phanAnh.lich_su_trang_thai)?.ten;
    if (
      lastStatus === PHAN_ANH_STATUS.DA_GIAI_QUYET ||
      lastStatus === PHAN_ANH_STATUS.DONG
    ) {
      throw new BaseError(
        400,
        "Không thể phân công cho phản ánh đã được giải quyết hoặc đóng",
      );
    }

    if (phanAnh.id_to === idNguoiXuLy) {
      throw new BaseError(
        400,
        "Chuyên viên xử lý mới phải khác người đang phụ trách",
      );
    }

    const existingUser = await UserRepository.findById(currentUser);
    if (!existingUser) {
      throw new BaseError(400, "Người dùng không tồn tại");
    }

    // Chuyên viên được gán phải nằm trong nhóm quản lý lĩnh vực của phản ánh.
    const managers = await LinhVucPhanAnhRepository.getManagersByLinhVucId(
      phanAnh.id_linh_vuc_phan_anh,
    );
    const target = managers.find((m) => m.id === idNguoiXuLy);
    if (!target) {
      throw new BaseError(
        400,
        "Chuyên viên được chọn không quản lý lĩnh vực của phản ánh này",
      );
    }

    // Đổi người phụ trách + ghi lịch sử kèm lý do (giữ ten = trạng thái hiện tại
    // để không phá luồng trạng thái tuyến tính). Atomic trong 1 transaction.
    await PhanAnhRepository.updateLinhVucWithHistory(
      idPhanAnh,
      {
        id_to: idNguoiXuLy,
        nguoi_cap_nhat: currentUser,
        thoi_gian_cap_nhat: new Date().toISOString(),
      },
      {
        ten: lastStatus,
        ghi_chu: `Chuyển xử lý cho "${target.ho_va_ten || target.ten_dang_nhap}". Lý do: ${lyDo}`,
        nguoi_tao: currentUser,
      },
    );

    // Thông báo cho chuyên viên được phân công.
    await NotificationRepository.createNotification({
      user_id: idNguoiXuLy,
      body: `Bạn được phân công xử lý phản ánh với mã ${phanAnh.ma_phan_anh}`,
      target_id: phanAnh.ma_phan_anh,
      target_type: "PHAN_ANH",
      title: "Phân công xử lý phản ánh",
    });

    return { id_to: idNguoiXuLy };
  },

  async getTongQuanPhanAnh({
    preset = "today",
    startDate,
    endDate,
    khuPho = "all",
    idLinhVuc = "all",
    permissions = [],
    cate = "",
    isInternal = false,
  } = {}) {
    const period = resolveDashboardPeriod({ preset, startDate, endDate });
    const { effectiveLinhVucIds } = resolveDashboardScope({
      permissions: isInternal
        ? ["PA_THUONG_TRUC"]
        : permissions,
      cate,
      idLinhVuc,
    });

    let {
      nhat_ky_hoat_dong,
      tong_so,
      previous_tong_so,
      tong_hom_nay,
      tong_nguoi_dan,
      current_nguoi_dan,
      previous_nguoi_dan,
      current_ty_le_xu_ly,
      previous_ty_le_xu_ly,
      qua_han,
      khan_cap,
      thong_ke_theo_trang_thai,
      thong_ke_theo_khu_pho,
      top_khu_pho,
      ty_le_xu_ly_theo_khu_pho,
      thong_ke_theo_linh_vuc,
      thong_ke_theo_han_xu_ly,
      xu_huong_phan_anh,
    } = await PhanAnhRepository.getTongQuanPhanAnh({
      currentPeriod: period.current,
      previousPeriod: period.previous,
      todayPeriod: period.today,
      khuPho,
      effectiveLinhVucIds,
    });

    nhat_ky_hoat_dong = nhat_ky_hoat_dong.map((log) => {
      log.is_success = log.response_status_code === 200;
      log.hanh_dong = log.table_name;
      log.table_name = undefined;
      log.response_status_code = undefined;
      return log;
    });

    const nguoiDanChange = getChange(current_nguoi_dan, previous_nguoi_dan);
    const phanAnhChange = getChange(tong_so, previous_tong_so);
    const tyLeXuLyChange = getChange(current_ty_le_xu_ly, previous_ty_le_xu_ly, {
      percentagePoint: true,
    });

    return {
      tong_so,
      tong_hom_nay,
      tong_nguoi_dan,
      ty_le_xu_ly: current_ty_le_xu_ly,
      qua_han,
      khan_cap,
      pt_nguoi_dan: nguoiDanChange.value,
      huong_nguoi_dan: nguoiDanChange.direction,
      pt_phan_anh: phanAnhChange.value,
      huong_phan_anh: phanAnhChange.direction,
      pt_ty_le_xu_ly: tyLeXuLyChange.value,
      huong_ty_le_xu_ly: tyLeXuLyChange.direction,
      thong_ke_theo_trang_thai,
      thong_ke_theo_khu_pho,
      top_khu_pho,
      ty_le_xu_ly_theo_khu_pho,
      thong_ke_theo_linh_vuc,
      thong_ke_theo_han_xu_ly,
      xu_huong_phan_anh,
      nhat_ky_hoat_dong,
      ky_hien_tai: {
        startDate: period.current.startDate,
        endDate: period.current.endDate,
      },
      ky_doi_chieu: {
        startDate: period.previous.startDate,
        endDate: period.previous.endDate,
      },
    };
  },

  async getMucDoAndTrangThaiAndLinhVuc() {
    let linhVucPhanAnh =
      await LinhVucPhanAnhRepository.getAllActiveLinhVucPhanAnh();
    return {
      PHAN_ANH_MUC_DO,
      PHAN_ANH_STATUS,
      LINH_VUC_PHAN_ANH: linhVucPhanAnh,
    };
  },

  async searhByTieuDe(search = "") {
    if (search.trim().length <= 2) {
      throw new BaseError(400, "Từ khóa tìm kiếm phải có ít nhất 3 ký tự");
    }

    const phanAnhs = await PhanAnhRepository.searhByTieuDe(search);
    return phanAnhs.map((phanAnh) => ({
      ...phanAnh,
      lich_su_trang_thai: getPhanAnhLifecycleHistory(phanAnh.lich_su_trang_thai),
    }));
  },

  async createPhanAnhPublic(
    idLinhVucPhanAnh,
    tieuDe,
    moTa,
    viTri,
    mucDo,
    tenNguoiPhanAnh,
    soDienThoaiNguoiPhanAnh,
    khuPho,
    moTaViTri,
    file,
    idVideo = [],
  ) {
    // Validate file exists
    const hasFile = Array.isArray(file) && file.length > 0;
    const hasVideo = Array.isArray(idVideo) && idVideo.length > 0;
    if (!hasFile && !hasVideo) {
      throw new BaseError(400, "Phải đính kèm ít nhất một ảnh hoặc video");
    }

    // Validate category exists
    const existingLinhVuc =
      await LinhVucPhanAnhRepository.findById(idLinhVucPhanAnh);
    if (!existingLinhVuc || existingLinhVuc.is_active === false) {
      throw new BaseError(400, "Lĩnh vực phản ánh không tồn tại");
    }

    tieuDe = capitalizeWords(tieuDe);
    tenNguoiPhanAnh = capitalizeWords(tenNguoiPhanAnh);

    let data = {
      id_linh_vuc_phan_anh: idLinhVucPhanAnh,

      tieu_de: tieuDe,
      mo_ta: moTa,
      vi_tri: viTri,
      muc_do: mucDo,
      ten_nguoi_phan_anh: tenNguoiPhanAnh,
      sdt_nguoi_phan_anh: soDienThoaiNguoiPhanAnh,
      khu_pho: khuPho,
      mo_ta_vi_tri: moTaViTri || null,
      id_video: idVideo,
      id_video_giai_quyet: [],
      ma_phan_anh: generateUniqueCode(),
      // Phản ánh khẩn cấp công khai cũng phải chờ cán bộ duyệt.
      is_approve: mucDo !== PHAN_ANH_MUC_DO.KHAN_CAP,
    };

    const attachments = (file || []).map((f) => ({
      dinh_dang_file: f.mimetype,
      url_file: f.relativeUrl,
      kich_thuoc_file_mb: f.sizeMB,
      loai: DINH_KEM_LOAI.PHAN_ANH,
    }));

    const { createdPhanAnh, trangThai } =
      await PhanAnhRepository.createWithInitialState(
        data,
        { ten: PHAN_ANH_STATUS.DA_GUI },
        attachments,
      );

    let managerMailList =
      await LinhVucPhanAnhRepository.getManagerEmailsByLinhVucId(
        idLinhVucPhanAnh,
      );

    let allAdmin = await UserRepository.getAllAdmin();

    let bcc = [...allAdmin, ...managerMailList];

    const uniqueEmails = [...new Set(bcc)];

    const safeUrl = (base, id) => {
      if (!base) return null;
      return `${base}/${id}`;
    };

    const url = safeUrl(URL_PHAN_ANH_MANAGER, createdPhanAnh.id);

    let mailData = {
      maPhanAnh: createdPhanAnh.ma_phan_anh,
      tieuDe: createdPhanAnh.tieu_de,
      moTa: createdPhanAnh.mo_ta,
      mucDo: createdPhanAnh.muc_do,
      viTri: createdPhanAnh.vi_tri,
    };

    if (url) {
      mailData.url = url;
    }

    await MailService.sendMailCC({
      bcc: uniqueEmails,
      type: MAIL_TYPE.CREATE_PHAN_ANH,
      data: mailData,
    });

    return {
      id_phan_anh: createdPhanAnh.id,
      ma_phan_anh: createdPhanAnh.ma_phan_anh,
      tieu_de: createdPhanAnh.tieu_de,
      mo_ta: createdPhanAnh.mo_ta,
      vi_tri: createdPhanAnh.vi_tri,
      muc_do: createdPhanAnh.muc_do,
      ten_nguoi_phan_anh: createdPhanAnh.ten_nguoi_phan_anh,
      sdt_nguoi_phan_anh: createdPhanAnh.sdt_nguoi_phan_anh,
      khu_pho: createdPhanAnh.khu_pho,
      mo_ta_vi_tri: createdPhanAnh.mo_ta_vi_tri,
      trang_thai: trangThai.ten,
      is_approve: createdPhanAnh.is_approve,
      hinh_anh_dinh_kems: (file || []).map((f) => ({
        dinh_dang_file: f.mimetype,
        url_file: f.relativeUrl,
        kich_thuoc_file_mb: f.sizeMB,
      })),
    };
  },
};

const handleSendNotificationByExpo = async (
  phanAnh,
  trangThai,
  ghiChu,
  userId,
) => {
  const existingUser = await UserRepository.findById(userId);

  if (!existingUser || !existingUser.fcm_token) {
    console.log(
      "Người dùng không tồn tại hoặc không có Expo push token để gửi thông báo",
    );
    return;
  }

  const expoPushToken = existingUser.fcm_token;

  const message = {
    title: "Cập nhật trạng thái phản ánh",
    body: `Phản ánh của bạn với mã ${phanAnh.ma_phan_anh} đã được cập nhật trạng thái: ${trangThai}`,
    data: {
      ma_phan_anh: phanAnh.ma_phan_anh,
      ghi_chu: ghiChu ?? "",
      id: phanAnh.id,
    },
  };

  try {
    if (expoPushToken.length !== 0) {
      for (let token of expoPushToken) {
        await ExpoNotiRepository.sendNotification(token, message);
      }
    }
  } catch (err) {
    console.error("Expo push error:", err);
  }
};

const handleSendNotification = (phanAnh, trangThai, ghiChu) => {
  // Gửi thông báo qua socket.io
  console.log(
    `Gửi thông báo trạng thái phản ánh [${phanAnh.ma_phan_anh}] mới: ${trangThai} đến người dùng ID: ${phanAnh.nguoi_tao}`,
  );

  const io = getIO();

  const targetRoom = `user_${phanAnh.nguoi_tao}`;

  const payload = {
    ma_phan_anh: phanAnh.ma_phan_anh,
    trang_thai: trangThai,
    tieu_de: "Phản ánh của bạn đã được cập nhật",
    ghi_chu: ghiChu,
  };

  io.to(targetRoom).emit("phan-anh.update-status", payload);

  console.log(`Đã gửi thông báo đến room: ${targetRoom}`);
};

const handleSendNotificationByFirebase = async (
  phanAnh,
  trangThai,
  ghiChu,
  userId,
) => {
  const existingUser = await UserRepository.findById(userId);
  if (!existingUser || !existingUser.fcm_token) {
    console.log(
      `Người dùng không tồn tại hoặc không có FCM token để gửi thông báo`,
    );
    return;
  }
  const fcmToken = existingUser.fcm_token;
  const title = "Cập nhật trạng thái phản ánh";
  const body = `Phản ánh của bạn với mã ${phanAnh.ma_phan_anh} đã được cập nhật trạng thái: ${trangThai}`;
  let fcm = adminFirebase.messaging();
  const data = {
    ma_phan_anh: phanAnh.ma_phan_anh,
    ghi_chu: ghiChu ?? "",
  };
  try {
    await fcm.send({
      token: fcmToken,
      notification: { title, body },
      data,
    });
  } catch (err) {
    console.error("FCM send error:", err);
  }
};

const handleSendMailNotification = async (
  phanAnh,
  trangThai,
  ghiChu,
  userId,
  managerMailList,
) => {
  const existingUser = await UserRepository.findById(userId);

  const safeUrl = (base, id) => {
    if (!base) return null;
    return `${base}/${id}`;
  };

  const urlUser = safeUrl(URL_PHAN_ANH_USER, phanAnh.ma_phan_anh);
  const urlManager = safeUrl(URL_PHAN_ANH_MANAGER, phanAnh.id);

  const timestampVN = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });

  if (existingUser && existingUser?.email) {
    const userData = {
      maPhanAnh: phanAnh.ma_phan_anh,
      trangThaiMoi: trangThai,
      ghiChu,
      tieuDe: phanAnh.tieu_de,
      moTa: phanAnh.mo_ta,
      updatedAt: timestampVN,
    };

    if (urlUser) {
      userData.url = urlUser;
    }

    await MailService.sendMail(
      existingUser.email,
      MAIL_TYPE.PHAN_ANH_STATUS_UPDATED,
      userData,
    );
  } else {
    console.log("User không có email → không gửi thông báo cho user");
  }

  const managerData = {
    maPhanAnh: phanAnh.ma_phan_anh,
    trangThaiMoi: trangThai,
    ghiChu,
    tieuDe: phanAnh.tieu_de,
    moTa: phanAnh.mo_ta,
    updatedAt: timestampVN,
  };

  if (urlManager) {
    managerData.url = urlManager;
  }

  let allAdmin = await UserRepository.getAllAdmin();

  let bcc = [...allAdmin, ...managerMailList];

  const uniqueEmails = [...new Set(bcc)];

  await MailService.sendMailCC({
    bcc: uniqueEmails,
    type: MAIL_TYPE.PHAN_ANH_STATUS_UPDATED,
    data: managerData,
  });
};

const resolveMailTarget = (firstAdminEmail, managerMailList) => {
  if (firstAdminEmail) {
    return {
      to: firstAdminEmail,
      cc: managerMailList,
    };
  }

  if (managerMailList.length > 0) {
    return {
      to: managerMailList[0],
      cc: managerMailList.slice(1),
    };
  }

  return null;
};

export default PhanAnhService;
