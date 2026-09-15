import cron from "node-cron";
import LeaderMeetingRegistrationService from "../services/leader-meeting-registration.service.js";

export const runLeaderMeetingStatusTransition = async (now = new Date()) => {
  // Quét đơn PENDING quá hạn trước, sau đó tự bắt đầu các đơn đã APPROVED.
  const overdue = await LeaderMeetingRegistrationService.markOverdueRegistrations(now);
  const processing =
    await LeaderMeetingRegistrationService.startDueApprovedRegistrations(now);

  if (overdue.transitioned > 0) {
    console.log(
      `[leader-meeting-status] Đã chuyển ${overdue.transitioned} đăng ký sang OVERDUE.`
    );
  }
  if (processing.transitioned > 0) {
    console.log(
      `[leader-meeting-status] Đã chuyển ${processing.transitioned} đăng ký APPROVED sang IN_PROGRESS.`
    );
  }

  return { overdue: overdue.transitioned, processing: processing.transitioned };
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
