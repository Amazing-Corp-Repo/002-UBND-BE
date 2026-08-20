import LeaderMeetingScheduleRepository from "../repositories/leader-meeting-schedule.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";

const formatVietnamDate = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const formatVietnamTime = (date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const isPastSlot = (receptionDate, startTime, now) => {
  const date = formatVietnamDate(new Date(receptionDate));
  const today = formatVietnamDate(now);
  if (date !== today) return date < today;
  return startTime <= formatVietnamTime(now);
};

const mapSlot = (slot) => {
  const heldCount = slot.dang_ky_gap_lanh_dao.length;
  const remainingCapacity = Math.max(0, slot.suc_chua - heldCount);
  const isFull = remainingCapacity === 0;

  return {
    id: slot.id,
    startTime: slot.gio_bat_dau,
    endTime: slot.gio_ket_thuc,
    timeSlot: `${slot.gio_bat_dau} - ${slot.gio_ket_thuc}`,
    capacity: slot.suc_chua,
    heldCount,
    remainingCapacity,
    status: isFull ? "FULL" : "AVAILABLE",
    isFull,
  };
};

const LeaderMeetingScheduleService = {
  async getAvailableSchedules(filters = {}) {
    const now = new Date();
    const fromDate = filters.fromDate || formatVietnamDate(now);
    const toDate = filters.toDate || formatVietnamDate(addDays(now, 90));

    if (fromDate > toDate) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }

    const schedules =
      await LeaderMeetingScheduleRepository.findAvailableBetweenDates({
        fromDate,
        toDate,
        leaderId: filters.leaderId,
      });

    return schedules
      .map((schedule) => ({
        id: schedule.id,
        leader: {
          id: schedule.lanh_dao.id,
          fullName: schedule.lanh_dao.ho_va_ten,
        },
        receptionDate: formatVietnamDate(schedule.ngay),
        location: schedule.dia_diem,
        note: schedule.ghi_chu,
        slots: schedule.khung_gio_gap_lanh_dao
          .filter(
            (slot) => !isPastSlot(schedule.ngay, slot.gio_bat_dau, now)
          )
          .map(mapSlot),
      }))
      .filter((schedule) => schedule.slots.length > 0);
  },

  async getManagementSchedules(filters, currentUser) {
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }

    const roles = currentUser.roles || [];
    const canViewAll = roles.some((role) =>
      ["ADMIN", "APPROVER", "PHE_DUYET"].includes(role)
    );
    const result = await LeaderMeetingScheduleRepository.findManagement({
      ...filters,
      leaderId: canViewAll ? undefined : currentUser.userId,
    });

    return {
      data: result.data.map((schedule) => {
        const registrations = schedule.khung_gio_gap_lanh_dao.flatMap(
          (slot) => slot.dang_ky_gap_lanh_dao
        );
        return {
          id: schedule.id,
          leader: {
            id: schedule.lanh_dao.id,
            fullName: schedule.lanh_dao.ho_va_ten,
          },
          receptionDate: formatVietnamDate(schedule.ngay),
          location: schedule.dia_diem,
          note: schedule.ghi_chu,
          isActive: schedule.is_active,
          slotCount: schedule.khung_gio_gap_lanh_dao.length,
          totalCapacity: schedule.khung_gio_gap_lanh_dao.reduce(
            (total, slot) => total + slot.suc_chua,
            0
          ),
          registrationCount: registrations.length,
          statusSummary: registrations.reduce((summary, registration) => {
            summary[registration.trang_thai] =
              (summary[registration.trang_thai] || 0) + 1;
            return summary;
          }, {}),
          createdAt: schedule.thoi_gian_tao,
          updatedAt: schedule.thoi_gian_cap_nhat,
        };
      }),
      pagination: createPagination(filters.page, filters.size, result.totalItems),
    };
  },
};

export default LeaderMeetingScheduleService;
