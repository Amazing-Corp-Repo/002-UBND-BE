import cron from "node-cron";
import LeaderMeetingRegistrationService from "../services/leader-meeting-registration.service.js";

export const runLeaderMeetingStatusTransition = async (now = new Date()) => {
  const result =
    await LeaderMeetingRegistrationService.transitionDueApprovedToInProgress(now);

  if (result.transitioned > 0) {
    console.log(
      `[leader-meeting-status] Đã chuyển ${result.transitioned} đăng ký sang IN_PROGRESS.`
    );
  }

  return result;
};

export const registerLeaderMeetingStatusCron = () => {
  // Chạy ngay khi server khởi động để bù khoảng thời gian server ngừng hoạt động.
  runLeaderMeetingStatusTransition().catch((error) => {
    console.error(
      `[leader-meeting-status] Lỗi đồng bộ trạng thái khi khởi động: ${error.message}`
    );
  });

  // Đồng bộ mỗi phút; updateMany giữ thao tác an toàn khi chạy lặp.
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        await runLeaderMeetingStatusTransition();
      } catch (error) {
        console.error(
          `[leader-meeting-status] Lỗi đồng bộ trạng thái: ${error.message}`
        );
      }
    },
    { timezone: "Asia/Ho_Chi_Minh" }
  );
};
