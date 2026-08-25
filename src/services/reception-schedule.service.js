import ReceptionScheduleRepository from "../repositories/reception-schedule.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { formatVietnamDate } from "../utils/vietnam-time.util.js";

const MAX_TRANSACTION_RETRIES = 3;

const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

export const getReceptionVisibilityWindow = (now = new Date()) => ({
  fromDate: formatVietnamDate(now),
  toDate: formatVietnamDate(addDays(now, 6)),
});

const toMinutes = (value) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;

export const buildHourlySlots = (timeRange) => {
  const match = timeRange?.match(
    /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/
  );
  if (!match) return [];

  const [start, end] = timeRange.split("-").map((value) => value.trim());
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  if (startMinutes >= endMinutes) return [];

  const slots = [];
  for (let current = startMinutes; current < endMinutes; current += 60) {
    const slotEnd = Math.min(current + 60, endMinutes);
    slots.push(`${toTime(current)} - ${toTime(slotEnd)}`);
  }
  return slots;
};

const ReceptionScheduleService = {
  async getAvailableSchedules(filters = {}) {
    const today = new Date();
    const visibilityWindow = getReceptionVisibilityWindow(today);
    const requestedFromDate = filters.fromDate
      ? formatVietnamDate(new Date(filters.fromDate))
      : visibilityWindow.fromDate;
    const requestedToDate = filters.toDate
      ? formatVietnamDate(new Date(filters.toDate))
      : visibilityWindow.toDate;

    if (requestedFromDate > requestedToDate) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }

    const fromDate =
      requestedFromDate < visibilityWindow.fromDate
        ? visibilityWindow.fromDate
        : requestedFromDate;
    const toDate =
      requestedToDate > visibilityWindow.toDate
        ? visibilityWindow.toDate
        : requestedToDate;

    if (fromDate > toDate) return [];

    const schedules = await ReceptionScheduleRepository.findActiveBetweenDates(
      fromDate,
      toDate
    );

    return schedules.map((item) => ({
      id: item.id,
      receptionDate: formatVietnamDate(item.ngay_tiep_dan),
      timeRange: item.thoi_gian,
    }));
  },

  async updateSlotCapacity(scheduleId, slotId, capacity, currentUser) {
    let result;
    for (let attempt = 0; attempt < MAX_TRANSACTION_RETRIES; attempt += 1) {
      try {
        result = await ReceptionScheduleRepository.updateSlotCapacity(
          scheduleId,
          slotId,
          capacity,
          currentUser
        );
        break;
      } catch (error) {
        if (error?.code !== "P2034" || attempt === MAX_TRANSACTION_RETRIES - 1) {
          throw error;
        }
      }
    }
    if (result.conflict === "SLOT_NOT_FOUND") {
      throw new BaseError(404, "Không tìm thấy cấu hình quầy của lịch tiếp dân");
    }
    if (result.conflict === "BELOW_COUNTER_HELD") {
      throw new BaseError(
        409,
        "Không được giảm sức chứa thấp hơn số đăng ký đã gán vào quầy"
      );
    }
    if (result.conflict === "BELOW_SLOT_HELD") {
      throw new BaseError(
        409,
        "Không được giảm tổng sức chứa ca thấp hơn số đăng ký đã giữ chỗ"
      );
    }

    return {
      id: result.slot.id,
      scheduleId: result.slot.id_lich_tiep_dan,
      timeSlot: result.slot.khung_gio,
      counterCode: result.slot.ma_quay,
      capacity: result.slot.suc_chua,
      assignedCount: result.assignedCount,
      slotHeldCount: result.heldCount,
      slotTotalCapacity: result.totalCapacity,
    };
  },
};

export default ReceptionScheduleService;
