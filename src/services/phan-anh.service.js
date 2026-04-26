import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
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
import ExpoNotiRepository from "../repositories/http/expo-noti.repository.js";

const ORDER = [
  PHAN_ANH_STATUS.DA_GUI,
  PHAN_ANH_STATUS.DA_TIEP_NHAN,
  PHAN_ANH_STATUS.DANG_XU_LY,
  PHAN_ANH_STATUS.DA_GIAI_QUYET,
];

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
    userId,
    file,
    idVideo = [],
  ) {
    if (!file || file.length === 0) {
      throw new BaseError(400, "Phải tải lên ít nhất một tệp tin đính kèm");
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
      id_video: idVideo,
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

    let createdPhanAnh = await PhanAnhRepository.create(data);

    let trangThai = await PhanAnhRepository.createLichSuTrangThaiPhanAnh({
      id_phan_anh: createdPhanAnh.id,
      ten: PHAN_ANH_STATUS.DA_GUI,
    });

    const attachments = file.map((f) => ({
      id_phan_anh: createdPhanAnh.id,
      dinh_dang_file: f.mimetype,
      url_file: f.relativeUrl,
      kich_thuoc_file_mb: f.sizeMB,
    }));

    await PhanAnhRepository.addFileToPhanAnh(attachments);

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
      trang_thai: trangThai.ten,
      nguoi_tao: createdPhanAnh.nguoi_tao,
      hinh_anh_dinh_kems: file.map((f) => ({
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
    return phanAnh;
  },

  async updateStatusPhanAnh(
    idPhanAnh,
    thoiGianPhanHoiDuKien,
    ngayDuKienHoanThanh,
    trangThai,
    ghiChu,
    currentUser,
  ) {
    if (idPhanAnh === null || idPhanAnh === undefined) {
      throw new BaseError(400, "ID phản ánh không được để trống");
    }
    let phanAnh = await PhanAnhRepository.getById(idPhanAnh);

    if (!phanAnh) {
      throw new BaseError(400, "Phản ánh không tồn tại");
    }
    const lastStatus = phanAnh.lich_su_trang_thai[0].ten;
    if (
      lastStatus === PHAN_ANH_STATUS.DA_GIAI_QUYET ||
      lastStatus === PHAN_ANH_STATUS.DONG
    ) {
      throw new BaseError(
        400,
        "Không thể cập nhật trạng thái cho phản ánh đã được giải quyết hoặc đóng",
      );
    }
    if (trangThai !== PHAN_ANH_STATUS.DONG) {
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

    const phanAnhPatch = {
      nguoi_cap_nhat: currentUser,
      thoi_gian_tiep_nhan:
        trangThai === PHAN_ANH_STATUS.DA_TIEP_NHAN
          ? new Date().toISOString()
          : phanAnh.thoi_gian_tiep_nhan,
      // thoi_gian_phan_hoi_du_kien: thoiGianPhanHoiDuKien,
      // ngay_du_kien_hoan_thanh: ngayDuKienHoanThanh,
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
    );

    if (phanAnh.nguoi_tao) {
      await NotificationRepository.createNotification({
        user_id: phanAnh.nguoi_tao,
        body: `Phản ánh của bạn với mã ${phanAnh.ma_phan_anh} đã được cập nhật trạng thái: ${trangThai}`,
        target_id: phanAnh.ma_phan_anh,
        target_type: "PHAN_ANH",
        title: "Cập nhật trạng thái phản ánh",
      });

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
    }
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
    idTo,
    tieuDe,
    moTa,
    viTri,
    mucDo,
    tenNguoiPhanAnh,
    soDienThoaiNguoiPhanAnh,
    file,
    idVideo = [],
  ) {
    // Validate file exists
    if (!file || file.length === 0) {
      throw new BaseError(400, "Phải tải lên ít nhất một tệp tin đính kèm");
    }

    // Validate category exists
    const existingLinhVuc =
      await LinhVucPhanAnhRepository.findById(idLinhVucPhanAnh);
    if (!existingLinhVuc || existingLinhVuc.is_active === false) {
      throw new BaseError(400, "Lĩnh vực phản ánh không tồn tại");
    }

    // Validate ward/district user exists
    const existingTo = await UserRepository.findById(idTo);
    if (!existingTo || existingTo.is_active === false) {
      throw new BaseError(400, "Khu phố không tồn tại");
    }

    tieuDe = capitalizeWords(tieuDe);
    tenNguoiPhanAnh = capitalizeWords(tenNguoiPhanAnh);

    let data = {
      id_linh_vuc_phan_anh: idLinhVucPhanAnh,
      id_to: idTo,
      tieu_de: tieuDe,
      mo_ta: moTa,
      vi_tri: viTri,
      muc_do: mucDo,
      ten_nguoi_phan_anh: tenNguoiPhanAnh,
      sdt_nguoi_phan_anh: soDienThoaiNguoiPhanAnh,
      id_video: idVideo,
      ma_phan_anh: generateUniqueCode(),
      is_approve: false, // Chưa duyệt
    };

    let createdPhanAnh = await PhanAnhRepository.create(data);

    // Create initial status
    let trangThai = await PhanAnhRepository.createLichSuTrangThaiPhanAnh({
      id_phan_anh: createdPhanAnh.id,
      ten: PHAN_ANH_STATUS.DA_GUI,
    });

    // Add file attachments
    const attachments = file.map((f) => ({
      id_phan_anh: createdPhanAnh.id,
      dinh_dang_file: f.mimetype,
      url_file: f.relativeUrl,
      kich_thuoc_file_mb: f.sizeMB,
    }));

    await PhanAnhRepository.addFileToPhanAnh(attachments);

    return {
      id_phan_anh: createdPhanAnh.id,
      ma_phan_anh: createdPhanAnh.ma_phan_anh,
      tieu_de: createdPhanAnh.tieu_de,
      mo_ta: createdPhanAnh.mo_ta,
      vi_tri: createdPhanAnh.vi_tri,
      muc_do: createdPhanAnh.muc_do,
      ten_nguoi_phan_anh: createdPhanAnh.ten_nguoi_phan_anh,
      sdt_nguoi_phan_anh: createdPhanAnh.sdt_nguoi_phan_anh,
      trang_thai: trangThai.ten,
      is_approve: createdPhanAnh.is_approve,
      hinh_anh_dinh_kems: file.map((f) => ({
        dinh_dang_file: f.mimetype,
        url_file: f.relativeUrl,
        kich_thuoc_file_mb: f.sizeMB,
      })),
    };
  },

  async getPendingApprovalPhanAnh(page, size, sortTime, userPayload) {
    // Get ward info from user payload (user phải là ward)
    const userId = userPayload.userId;
    console.log("User ID from payload:", userId);
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new BaseError(404, "Người dùng không tồn tại");
    }

    const { data, totalItems } =
      await PhanAnhRepository.getPendingApprovalPhanAnh(
        userId,
        page,
        size,
        sortTime,
      );

    let pagination = createPagination(page, size, totalItems);

    return { data, pagination };
  },

  async approveOrRejectPhanAnh(idPhanAnh, isApprove, userPayload) {
    const userId = userPayload.userId;

    // Find feedback
    const phanAnh = await PhanAnhRepository.getById(idPhanAnh);
    if (!phanAnh) {
      throw new BaseError(404, "Phản ánh không tồn tại");
    }

    // Check if this ward is the one assigned
    if (phanAnh.id_to !== userId) {
      throw new BaseError(403, "Bạn không có quyền duyệt phản ánh này");
    }

    // Check if already approved/rejected
    if (phanAnh.is_approve !== null && phanAnh.is_approve !== false) {
      throw new BaseError(400, "Phản ánh này đã được xử lý");
    }

    if (isApprove) {
      // Approve: update is_approve and assign to ward
      let updatedPhanAnh = await PhanAnhRepository.updatePhanAnh(idPhanAnh, {
        is_approve: true,
        // nguoi_tao will be set to the ward user
        nguoi_tao: userId,
      });


      return {
        id_phan_anh: updatedPhanAnh.id,
        is_approve: updatedPhanAnh.is_approve,
        message: "Phản ánh đã được duyệt",
      };
    } else {
      // Reject: just mark as rejected (not approved)
      await PhanAnhRepository.updatePhanAnh(idPhanAnh, {
        is_approve: false,
      });

      return {
        id_phan_anh: idPhanAnh,
        is_approve: false,
      };
    }
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

  if (existingUser?.email) {
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
