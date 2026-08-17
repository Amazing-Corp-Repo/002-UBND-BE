import LichTiepDanRepository from "../repositories/lich-tiep-dan.repository.js";
import { BaseError } from "../utils/base-error.util.js";

const formatVietnamDate = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

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
    const fromDate = filters.fromDate
      ? formatVietnamDate(new Date(filters.fromDate))
      : formatVietnamDate(today);
    const toDate = filters.toDate
      ? formatVietnamDate(new Date(filters.toDate))
      : formatVietnamDate(addDays(today, 90));

    if (fromDate > toDate) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }

    const schedules = await LichTiepDanRepository.findActiveBetweenDates(
      fromDate,
      toDate
    );

    return schedules.map((item) => ({
      id: item.id,
      officerName: item.ten_can_bo,
      location: item.dia_diem,
      receptionDate: item.ngay_tiep_dan,
      timeRange: item.thoi_gian,
      availableSlots: buildHourlySlots(item.thoi_gian),
      note: item.ghi_chu,
    }));
  },
};

export default ReceptionScheduleService;
