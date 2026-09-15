import LeaderMeetingRegistrationService from "../services/leader-meeting-registration.service.js";

const MAX_TIMER_DELAY_MS = 2_147_000_000;
let leaderMeetingStatusTimer;

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

export const scheduleNextLeaderMeetingStatusTransition = async () => {
  if (leaderMeetingStatusTimer) {
    clearTimeout(leaderMeetingStatusTimer);
    leaderMeetingStatusTimer = undefined;
  }

  const now = new Date();
  await runLeaderMeetingStatusTransition(now);
  const nextAt = await LeaderMeetingRegistrationService.getNextStatusTransitionAt(
    new Date()
  );
  if (!nextAt) return null;

  const delay = Math.max(0, nextAt.getTime() - Date.now());
  leaderMeetingStatusTimer = setTimeout(async () => {
    leaderMeetingStatusTimer = undefined;
    try {
      await scheduleNextLeaderMeetingStatusTransition();
    } catch (error) {
      console.error(
        `[leader-meeting-status] Lỗi đồng bộ trạng thái: ${error.message}`
      );
    }
  }, Math.min(delay, MAX_TIMER_DELAY_MS));

  console.log(
    `[leader-meeting-status] Lần đồng bộ tiếp theo: ${nextAt.toISOString()}`
  );
  return nextAt;
};

export const registerLeaderMeetingStatusCron = async () => {
  return scheduleNextLeaderMeetingStatusTransition();
};
