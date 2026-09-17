import cron from "node-cron";
import PhanAnhOverdueService from "../services/phan-anh-overdue.service.js";

export const runPhanAnhOverdueTransition = async (now = new Date()) => {
  try {
    const result = await PhanAnhOverdueService.markOverdueComplaints(now);
    if (result && result.count > 0) {
      console.log(
        `[phan-anh-overdue] Đã tự động cập nhật ${result.count} phản ánh sang trạng thái Quá hạn.`
      );
    }
    return result;
  } catch (error) {
    console.error(
      `[phan-anh-overdue] Lỗi khi quét phản ánh quá hạn: ${error.message}`
    );
  }
};

export const registerPhanAnhOverdueCron = () => {
  // Chạy ngay khi khởi động server
  runPhanAnhOverdueTransition().catch((error) => {
    console.error(
      `[phan-anh-overdue] Lỗi khởi động ban đầu: ${error.message}`
    );
  });

  // Quét mỗi phút 1 lần (* * * * *) theo giờ Việt Nam
  cron.schedule(
    "* * * * *",
    async () => {
      await runPhanAnhOverdueTransition();
    },
    { timezone: "Asia/Ho_Chi_Minh" }
  );
};
