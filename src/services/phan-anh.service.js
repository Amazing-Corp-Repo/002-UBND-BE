import PHAN_ANH_STATUS, {
  getAllowedPhanAnhStatusTransitions,
} from "../constants/phan-anh-status.constant.js";
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
import { getIO } from "../realtime/socket/index.js";
import adminFirebase from "../realtime/firebase/index.js";
import NotificationRepository from "../repositories/notification.repository.js";
import env from "../config/environment.config.js";
import MailService from "./mail.service.js";
import MAIL_TYPE from "../constants/mail.constant.js";
import DINH_KEM_LOAI from "../constants/dinh-kem-loai.constant.js";
import ExpoNotiRepository from "../repositories/http/expo-noti.repository.js";
import { calculatePhanAnhDeadline } from "../utils/phan-anh-deadline.util.js";
import { toPublicPhanAnhResponse } from "../utils/phan-anh-response.util.js";

const URL_PHAN_ANH_MANAGER = env.URL_PHAN_ANH_MANAGER;
const URL_PHAN_ANH_USER = env.URL_PHAN_ANH_USER;

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
      is_approve: true,
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
    return toPublicPhanAnhResponse(phanAnh);
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
  ) {
    let role = parseCommaString(payload.roles);
    let cate = parseCommaString(payload.cate);

    if (cate === null || cate === undefined || cate.length === 0) {
      let { data, totalItems } = await PhanAnhRepository.getAll(
        idLinhVucPhanAnh,
        trangThai,
        mucDo,
        maPhanAnh,
        page,
        size,
        sortTime,
        sortBy,
        sortOrder,
      );
      let pagination = createPagination(page, size, totalItems);
      return { data, pagination };
    }

    if (idLinhVucPhanAnh && !cate.includes(idLinhVucPhanAnh.trim())) {
      throw new BaseError(
        403,
        "Bạn không có quyền truy cập lĩnh vực phản ánh này",
      );
    }

    // Nếu có cate restriction, chỉ lấy các phản ánh thuộc cate đó
    const result = await PhanAnhRepository.getAllByCate(
      cate,
      idLinhVucPhanAnh ?? null,
      trangThai,
      mucDo,
      maPhanAnh,
      page,
      size,
      sortTime,
      sortBy,
      sortOrder,
    );

    return {
      data: result.data,
      pagination: createPagination(page, size, result.totalItems),
    };
  },

  async getLichSuTrangThaiPhanAnh(idPhanAnh) {
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }
    return await PhanAnhRepository.getLichSuTrangThaiPhanAnh(idPhanAnh);
  },

  async getPhanAnhByUserId(userId, sortTime) {
    if (userId === null || userId === undefined) {
      throw new BaseError(400, "ID người dùng không được để trống");
    }
    return await PhanAnhRepository.getPhanAnhByUserId(userId, sortTime);
  },

  getMucDoPhanAnh() {
    return PHAN_ANH_MUC_DO;
  },

  getTrangThaiPhanAnh() {
    return PHAN_ANH_STATUS;
  },

  async getPhanAnhById(idPhanAnh) {
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }
    let phanAnh = await PhanAnhRepository.getById(idPhanAnh);
    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }

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

    return phanAnh;
  },

  async updateStatusPhanAnh(
    idPhanAnh,
    trangThai,
    ghiChu,
    currentUser,
    file,
    idVideoGiaiQuyet = [],
    idNguoiXuLy,
    soNgayXuLy,
  ) {
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }
    let phanAnh = await PhanAnhRepository.getById(idPhanAnh);

    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }
    const lastStatus = phanAnh.lich_su_trang_thai[0]?.ten;
    const allowedNextStatuses =
      getAllowedPhanAnhStatusTransitions(lastStatus);
    if (!allowedNextStatuses.includes(trangThai)) {
      const expected = allowedNextStatuses.length
        ? allowedNextStatuses.join(" hoặc ")
        : "không còn trạng thái tiếp theo";
      throw new BaseError(
        400,
        `Không thể chuyển từ trạng thái ${lastStatus || "không xác định"} sang ${trangThai}. Trạng thái hợp lệ: ${expected}`,
      );
    }

    let existingUser = await UserRepository.findById(currentUser);
    if (!existingUser) {
      throw new BaseError(400, "Người dùng không tồn tại");
    }

    let assignedUser = null;
    let receivedAt;
    let expectedCompletionAt;
    if (trangThai === PHAN_ANH_STATUS.DANG_XU_LY) {
      const managers = await LinhVucPhanAnhRepository.getManagersByLinhVucId(
        phanAnh.id_linh_vuc_phan_anh,
      );
      assignedUser = managers.find((manager) => manager.id === idNguoiXuLy);
      if (!assignedUser) {
        throw new BaseError(
          400,
          "Chuyên viên được chọn không hoạt động hoặc không quản lý lĩnh vực của phản ánh này",
        );
      }

      if (
        phanAnh.muc_do !== PHAN_ANH_MUC_DO.KHAN_CAP &&
        !Number.isInteger(soNgayXuLy)
      ) {
        throw new BaseError(
          400,
          "Số ngày xử lý là bắt buộc đối với phản ánh thông thường",
        );
      }

      receivedAt = new Date();
      expectedCompletionAt = calculatePhanAnhDeadline({
        receivedAt,
        mucDo: phanAnh.muc_do,
        soNgayXuLy,
      });
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
      ...(trangThai === PHAN_ANH_STATUS.DANG_XU_LY && {
        id_to: idNguoiXuLy,
        thoi_gian_tiep_nhan: receivedAt,
        ngay_du_kien_hoan_thanh: expectedCompletionAt,
      }),
      // Lưu video hiện trường đã xử lý (nếu có) — tách riêng với id_video của công dân.
      ...(videoGiaiQuyet.length > 0 && {
        id_video_giai_quyet: videoGiaiQuyet,
      }),
    };

    const historyData = {
      ten: trangThai,
      ghi_chu:
        trangThai === PHAN_ANH_STATUS.DANG_XU_LY
          ? [
              `Phê duyệt và phân công cho "${assignedUser.ho_va_ten || assignedUser.ten_dang_nhap}"`,
              ghiChu,
            ]
              .filter(Boolean)
              .join(". ")
          : ghiChu,
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

    if (trangThai === PHAN_ANH_STATUS.DANG_XU_LY) {
      await NotificationRepository.createNotification({
        user_id: idNguoiXuLy,
        body: `Bạn được phân công xử lý phản ánh với mã ${phanAnh.ma_phan_anh}`,
        target_id: phanAnh.ma_phan_anh,
        target_type: "PHAN_ANH",
        title: "Phân công xử lý phản ánh",
      });
    }

    return await PhanAnhRepository.getById(idPhanAnh);
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

    const lastStatus = phanAnh.lich_su_trang_thai[0]?.ten;
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

    const lastStatus = phanAnh.lich_su_trang_thai[0]?.ten;
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

  async getTongQuanPhanAnh() {
    let { nhat_ky_hoat_dong, tong_hom_nay, thong_ke_theo_trang_thai } =
      await PhanAnhRepository.getTongQuanPhanAnh();

    nhat_ky_hoat_dong = nhat_ky_hoat_dong.map((log) => {
      log.is_success = log.response_status_code === 200;
      log.hanh_dong = log.table_name;
      log.table_name = undefined;
      log.response_status_code = undefined;
      return log;
    });

    return { tong_hom_nay, thong_ke_theo_trang_thai, nhat_ky_hoat_dong };
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

    return await PhanAnhRepository.searhByTieuDe(search);
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
      is_approve: true,
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
