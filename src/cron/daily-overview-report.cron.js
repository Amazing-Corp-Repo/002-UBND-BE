import cron from "node-cron";
import PhanAnhService from "../services/phan-anh.service.js";
import UserRepository from "../repositories/user.repository.js";
import MailService from "../services/mail.service.js";
import MAIL_TYPE from "../constants/mail.constant.js";
import { PERMISSION } from "../constants/permission.constant.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import env from "../config/environment.config.js";

const formatNgay = (date) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Gửi báo cáo thống kê tổng quan phản ánh cho tất cả cán bộ "thường trực"
// (user có role chứa quyền PA_THUONG_TRUC). Tách riêng để có thể gọi thủ công khi test.
export const runDailyOverviewReport = async () => {
  const recipients = await UserRepository.findUsersByPermissionCode(
    PERMISSION.PA_THUONG_TRUC
  );

  if (!recipients.length) {
    console.log(
      "[daily-overview-report] Không có cán bộ thường trực nào để gửi báo cáo."
    );
    return { sent: 0 };
  }

  const { tong_hom_nay, thong_ke_theo_trang_thai } =
    await PhanAnhService.getTongQuanPhanAnh();

  const data = {
    ngay: formatNgay(new Date()),
    tongHomNay: tong_hom_nay ?? 0,
    daGui: thong_ke_theo_trang_thai?.[PHAN_ANH_STATUS.DA_GUI] ?? 0,
    daTiepNhan: thong_ke_theo_trang_thai?.[PHAN_ANH_STATUS.DA_TIEP_NHAN] ?? 0,
    dangXuLy: thong_ke_theo_trang_thai?.[PHAN_ANH_STATUS.DANG_XU_LY] ?? 0,
    daGiaiQuyet: thong_ke_theo_trang_thai?.[PHAN_ANH_STATUS.DA_GIAI_QUYET] ?? 0,
    dong: thong_ke_theo_trang_thai?.[PHAN_ANH_STATUS.DONG] ?? 0,
    url: env.URL_PHAN_ANH_MANAGER,
  };

  for (const user of recipients) {
    await MailService.sendMail(user.email, MAIL_TYPE.DAILY_OVERVIEW_REPORT, {
      ...data,
      hoTen: user.ho_va_ten || "Quý cán bộ",
    });
  }

  console.log(
    `[daily-overview-report] Đã gửi báo cáo thống kê tới ${recipients.length} cán bộ thường trực.`
  );
  return { sent: recipients.length };
};

export const registerDailyOverviewReportCron = () => {
  // 08:00 giờ Việt Nam (UTC+7) = 01:00 UTC, mỗi ngày
  cron.schedule(
    "0 1 * * *",
    async () => {
      try {
        await runDailyOverviewReport();
      } catch (error) {
        console.error(
          `[daily-overview-report] Lỗi khi gửi báo cáo: ${error.message}`
        );
      }
    },
    {
      timezone: "utc",
    }
  );
};
