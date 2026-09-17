import UserRepository from "../repositories/user.repository.js";
import ExpoNotiRepository from "../repositories/http/expo-noti.repository.js";
import env from "../config/environment.config.js";
import MailService from "./mail.service.js";
import MAIL_TYPE from "../constants/mail.constant.js";

export const sendExpoStatusUpdate = async (phanAnh, trangThai, ghiChu, userId) => {
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
      for (const token of expoPushToken) {
        await ExpoNotiRepository.sendNotification(token, message);
      }
    }
  } catch (err) {
    console.error("Expo push error:", err);
  }
};

export const sendStatusEmailNotification = async (
  phanAnh,
  trangThai,
  ghiChu,
  userId,
  managerMailList,
) => {
  const existingUser = await UserRepository.findById(userId);
  const safeUrl = (base, id) => (base ? `${base}/${id}` : null);
  const urlUser = safeUrl(env.URL_PHAN_ANH_USER, phanAnh.ma_phan_anh);
  const urlManager = safeUrl(env.URL_PHAN_ANH_MANAGER, phanAnh.id);
  const timestampVN = new Date().toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });

  if (existingUser && existingUser.email) {
    const userData = {
      maPhanAnh: phanAnh.ma_phan_anh,
      trangThaiMoi: trangThai,
      ghiChu,
      tieuDe: phanAnh.tieu_de,
      moTa: phanAnh.mo_ta,
      updatedAt: timestampVN,
    };
    if (urlUser) userData.url = urlUser;

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
  if (urlManager) managerData.url = urlManager;

  const allAdmin = await UserRepository.getAllAdmin();
  const uniqueEmails = [...new Set([...allAdmin, ...managerMailList])];
  await MailService.sendMailCC({
    bcc: uniqueEmails,
    type: MAIL_TYPE.PHAN_ANH_STATUS_UPDATED,
    data: managerData,
  });
};
