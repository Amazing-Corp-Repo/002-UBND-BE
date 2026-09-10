import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import PHAN_ANH_EXTENSION_STATUS from "../constants/phan-anh-extension-status.constant.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import { PERMISSION } from "../constants/permission.constant.js";
import { toDbPhanAnhMucDo, toApiPhanAnhMucDo, toApiPhanAnhStatus } from "../utils/phan-anh-status.util.js";
import PhanAnhExtensionRepository from "../repositories/phan-anh-extension.repository.js";
import NotificationRepository from "../repositories/notification.repository.js";
import UserRepository from "../repositories/user.repository.js";

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
    trang_thai_phan_anh: toApiPhanAnhStatus(complaint?.lich_su_trang_thai?.[0]?.ten),
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

    const latestStatus = complaint.lich_su_trang_thai[0]?.ten;
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
    const fullAccess = hasExtensionFullAccess(permissions);
    const cateIds = parseCate(cate);
    if (!fullAccess && idLinhVuc && !cateIds.includes(idLinhVuc)) {
      throw new BaseError(403, "Bạn không có quyền truy cập lĩnh vực phản ánh này");
    }
    const scopedLinhVucIds = fullAccess
      ? undefined
      : cateIds;
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
    return mapExtension(extension);
  },
};

export default PhanAnhExtensionService;
