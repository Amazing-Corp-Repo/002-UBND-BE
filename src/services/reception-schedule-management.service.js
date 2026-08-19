import dayjs from "dayjs";
import { BaseError } from "../utils/base-error.util.js";
import {
  DEFAULT_RECEPTION_COUNTER_CAPACITY,
  DEFAULT_RECEPTION_WORKING_PERIODS,
  RECEPTION_COUNTER_CODES,
} from "../constants/reception-schedule.constant.js";
import ReceptionScheduleManagementRepository from "../repositories/reception-schedule-management.repository.js";
import LichTiepDanService from "./lich-tiep-dan.service.js";
import FileService from "./file.service.js";
import {
  appendDeleteSuffixc,
  toSnakeCaseNonAccent,
} from "../utils/string.util.js";
import { createPagination } from "../utils/response.util.js";

const toMinutes = (value) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;

const isRealCalendarDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

const parseImportDate = (value) => {
  if (typeof value === "number") {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000);
    return date.toISOString().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (isRealCalendarDate(normalized)) return normalized;
  const vietnameseDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized);
  if (!vietnameseDate) return null;
  const [, day, month, year] = vietnameseDate;
  const result = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return isRealCalendarDate(result) ? result : null;
};

const parseImportTime = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getUTCHours()).padStart(2, "0")}:${String(
      value.getUTCMinutes()
    ).padStart(2, "0")}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const minutes = Math.round((value - Math.floor(value)) * 1440) % 1440;
    return toTime(minutes);
  }
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(normalized)) return normalized;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parseImportTime(parsed);
};

const normalizeImportRow = (item, index, currentUser) => {
  const row = Object.fromEntries(
    Object.entries(item).map(([key, value]) => [toSnakeCaseNonAccent(key), value])
  );
  const rowNumber = index + 2;
  const officerName = String(row.ten_can_bo || "").trim();
  const location = String(row.dia_diem || "").trim();
  const receptionDate = parseImportDate(row.ngay_tiep_dan);
  const startTime = parseImportTime(row.tu);
  const endTime = parseImportTime(row.den);

  if (!officerName || !location || !receptionDate || !startTime || !endTime) {
    throw new BaseError(
      400,
      `Dòng ${rowNumber} thiếu hoặc sai địa điểm, cán bộ, ngày, giờ bắt đầu hoặc giờ kết thúc`
    );
  }

  let periods;
  try {
    periods = normalizeWorkingPeriods({
      workingPeriods: [{ startTime, endTime }],
    });
  } catch (error) {
    throw new BaseError(400, `Dòng ${rowNumber}: ${error.message}`);
  }
  const timeRange = periods
    .map((period) => `${period.startTime} - ${period.endTime}`)
    .join(", ");

  return {
    officerName,
    receptionDate,
    scheduleData: {
      ten_can_bo: officerName,
      dia_diem: location,
      ngay_tiep_dan: new Date(`${receptionDate}T00:00:00.000Z`),
      thoi_gian: timeRange,
      ghi_chu: row.ghi_chu ? String(row.ghi_chu).trim() : null,
      nguoi_tao: currentUser,
    },
    slotRows: buildScheduleSlotRows(periods, currentUser),
  };
};

export const normalizeWorkingPeriods = ({
  batDau,
  ketThuc,
  workingPeriods,
} = {}) => {
  const periods = workingPeriods?.length
    ? workingPeriods
    : batDau && ketThuc
      ? [{ startTime: batDau, endTime: ketThuc }]
      : DEFAULT_RECEPTION_WORKING_PERIODS;

  const normalized = periods
    .map(({ startTime, endTime }) => ({ startTime, endTime }))
    .sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime));

  normalized.forEach((period, index) => {
    const start = toMinutes(period.startTime);
    const end = toMinutes(period.endTime);
    if (start >= end) {
      throw new BaseError(400, "Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
    }
    if ((end - start) % 60 !== 0) {
      throw new BaseError(400, "Khoảng làm việc phải chia hết thành các ca một tiếng");
    }
    if (index > 0 && start < toMinutes(normalized[index - 1].endTime)) {
      throw new BaseError(400, "Các khoảng làm việc không được chồng nhau");
    }
  });

  return normalized;
};

export const buildScheduleSlotRows = (periods, currentUser) => {
  const timeSlots = periods.flatMap(({ startTime, endTime }) => {
    const slots = [];
    const end = toMinutes(endTime);
    for (let current = toMinutes(startTime); current < end; current += 60) {
      slots.push(`${toTime(current)} - ${toTime(current + 60)}`);
    }
    return slots;
  });

  return timeSlots.flatMap((khungGio) =>
    RECEPTION_COUNTER_CODES.map((maQuay) => ({
      khung_gio: khungGio,
      ma_quay: maQuay,
      suc_chua: DEFAULT_RECEPTION_COUNTER_CAPACITY,
      nguoi_tao: currentUser,
    }))
  );
};

const mapCreatedSchedule = (schedule) => {
  const slots = schedule.khung_gio_tiep_dan || [];
  const registrations = schedule.dang_ky_tiep_dan || [];
  const groupedSlots = new Map();

  slots.forEach((slot) => {
    const current = groupedSlots.get(slot.khung_gio) || {
      timeSlot: slot.khung_gio,
      totalCapacity: 0,
      counters: [],
    };
    current.totalCapacity += slot.suc_chua;
    current.counters.push({
      id: slot.id,
      counterCode: slot.ma_quay,
      capacity: slot.suc_chua,
      heldCount: 0,
      remainingCapacity: slot.suc_chua,
      isFull: false,
      isActive: slot.is_active,
    });
    groupedSlots.set(slot.khung_gio, current);
  });

  registrations.forEach((registration) => {
    const slot = groupedSlots.get(registration.slot);
    if (!slot) return;

    const counter = slot.counters.find(
      (item) => item.counterCode === registration.bo_phan
    );
    if (counter) {
      counter.heldCount += 1;
      counter.remainingCapacity = Math.max(0, counter.capacity - counter.heldCount);
      counter.isFull = counter.heldCount >= counter.capacity;
    } else {
      slot.unassignedHeldCount = (slot.unassignedHeldCount || 0) + 1;
    }
  });

  groupedSlots.forEach((slot) => {
    slot.unassignedHeldCount = slot.unassignedHeldCount || 0;
    slot.heldCount =
      slot.unassignedHeldCount +
      slot.counters.reduce((total, counter) => total + counter.heldCount, 0);
    slot.remainingCapacity = Math.max(0, slot.totalCapacity - slot.heldCount);
    slot.isFull = slot.heldCount >= slot.totalCapacity;
  });

  const {
    khung_gio_tiep_dan: _slots,
    dang_ky_tiep_dan: _registrations,
    ...scheduleData
  } = schedule;
  return { ...scheduleData, slots: [...groupedSlots.values()] };
};

const ReceptionScheduleManagementService = {
  ...LichTiepDanService,

  async getLichTiepDan(filters) {
    const { weekYear, monthYear, date, isActive } = filters;
    const data = await ReceptionScheduleManagementRepository.findAll({
      weekYear,
      monthYear,
      date,
      isActive:
        typeof isActive === "boolean" ? String(isActive) : isActive,
    });
    return data.sort((left, right) => {
      const dateDifference =
        new Date(left.ngay_tiep_dan).getTime() -
        new Date(right.ngay_tiep_dan).getTime();
      if (dateDifference !== 0) return dateDifference;
      return String(left.thoi_gian || "").localeCompare(
        String(right.thoi_gian || "")
      );
    });
  },

  async getLichTiepDanWithPagination(filters) {
    const { weekYear, monthYear, date, isActive, page, size } = filters;
    const { data, totalItems } =
      await ReceptionScheduleManagementRepository.findAllWithPagination({
        weekYear,
        monthYear,
        date,
        isActive:
          typeof isActive === "boolean" ? String(isActive) : isActive,
        page,
        size,
      });
    data.sort((left, right) => {
      const dateDifference =
        new Date(left.ngay_tiep_dan).getTime() -
        new Date(right.ngay_tiep_dan).getTime();
      if (dateDifference !== 0) return dateDifference;
      return String(left.thoi_gian || "").localeCompare(
        String(right.thoi_gian || "")
      );
    });
    return { data, pagination: createPagination(page, size, totalItems) };
  },

  async countLichTiepDan(filters) {
    const { weekYear, monthYear, date } = filters;
    const [total, active, inactive] = await Promise.all([
      ReceptionScheduleManagementRepository.countAll({
        weekYear,
        monthYear,
        date,
      }),
      ReceptionScheduleManagementRepository.countAll({
        weekYear,
        monthYear,
        date,
        isActive: "true",
      }),
      ReceptionScheduleManagementRepository.countAll({
        weekYear,
        monthYear,
        date,
        isActive: "false",
      }),
    ]);
    return { total, active, inactive };
  },

  async deleteLichTiepDan(id, currentUser) {
    const result =
      await ReceptionScheduleManagementRepository.softDeleteIfNoRegistrations(
        id,
        (schedule) => ({
          ten_can_bo: appendDeleteSuffixc(schedule.ten_can_bo),
          is_delete: true,
          nguoi_cap_nhat: currentUser,
          thoi_gian_cap_nhat: new Date(),
        })
      );

    if (result.status === "NOT_FOUND") {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại");
    }
    if (result.status === "ACTIVE") {
      throw new BaseError(
        409,
        "Không thể xóa lịch tiếp dân đang ở trạng thái hoạt động"
      );
    }
    if (result.status === "HAS_REGISTRATIONS") {
      throw new BaseError(
        409,
        "Không thể xóa lịch tiếp dân đã có đăng ký giữ chỗ"
      );
    }
  },

  async handleImport(files = [], currentUser) {
    if (!files?.length) {
      throw new BaseError(400, "File không được để trống");
    }
    const spreadsheetRows = await FileService.readSpreadsheetFile(files[0].path);
    const nonEmptyRows = spreadsheetRows.filter((row) =>
      Object.values(row).some((value) => value !== null && value !== "")
    );
    if (nonEmptyRows.length === 0) {
      throw new BaseError(400, "File import không có dữ liệu");
    }

    const records = nonEmptyRows.map((row, index) =>
      normalizeImportRow(row, index, currentUser)
    );
    const seen = new Set();
    for (const record of records) {
      const key = `${record.officerName.toLocaleLowerCase("vi")}::${record.receptionDate}`;
      if (seen.has(key)) {
        throw new BaseError(409, "File có lịch trùng cán bộ và ngày tiếp dân");
      }
      seen.add(key);
    }

    const conflicts =
      await ReceptionScheduleManagementRepository.findImportConflicts(records);
    if (conflicts.length > 0) {
      throw new BaseError(409, "Lịch của cán bộ trong ngày tiếp dân đã tồn tại");
    }

    await ReceptionScheduleManagementRepository.createManyWithSlots(records);
    const totalCounterSlots = records.reduce(
      (total, record) => total + record.slotRows.length,
      0
    );
    return {
      importedCount: records.length,
      totalCounterSlots,
    };
  },

  async getLichTiepDanById(id) {
    if (id === null || id === undefined) {
      throw new BaseError(400, "ID lịch tiếp dân không được để trống");
    }
    const data = await ReceptionScheduleManagementRepository.findDetailById(id);
    if (!data || data.is_delete) {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại");
    }
    return mapCreatedSchedule(data);
  },

  async createLichTiepDan(
    tenCanBo,
    diaDiem,
    ngayTiepDan,
    batDau,
    ketThuc,
    ghiChu,
    currentUser,
    workingPeriods
  ) {
    const existing = await ReceptionScheduleManagementRepository.findByCanBoAndNgay(
      tenCanBo,
      ngayTiepDan
    );
    if (existing) {
      throw new BaseError(
        400,
        "Lịch tiếp dân của cán bộ vào ngày này đã tồn tại"
      );
    }
    const normalizedPeriods = normalizeWorkingPeriods({
      batDau,
      ketThuc,
      workingPeriods,
    });
    const thoiGian = normalizedPeriods
      .map(({ startTime, endTime }) => `${startTime} - ${endTime}`)
      .join(", ");
    const slotRows = buildScheduleSlotRows(normalizedPeriods, currentUser);
    const data = await ReceptionScheduleManagementRepository.createWithSlots({
      ten_can_bo: tenCanBo,
      dia_diem: diaDiem,
      ngay_tiep_dan: ngayTiepDan,
      thoi_gian: thoiGian,
      ghi_chu: ghiChu,
      nguoi_tao: currentUser,
    }, slotRows);
    return mapCreatedSchedule(data);
  },

  async updateLichTiepDan(
    id,
    tenCanBo,
    diaDiem,
    ngayTiepDan,
    batDau,
    ketThuc,
    ghiChu,
    currentUser,
    workingPeriods
  ) {
    if (id === null || id === undefined) {
      throw new BaseError(400, "ID lịch tiếp dân không được để trống");
    }
    const existing = await ReceptionScheduleManagementRepository.findById(id);
    if (!existing || existing.is_delete) {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại");
    }
    const duplicate = await ReceptionScheduleManagementRepository.findByCanBoAndNgayExcludeId(
      tenCanBo,
      ngayTiepDan,
      id
    );
    if (duplicate) {
      throw new BaseError(
        400,
        "Lịch tiếp dân của cán bộ vào ngày này đã tồn tại"
      );
    }
    const hasNewWorkingPeriods = Boolean(
      workingPeriods?.length || (batDau && ketThuc)
    );
    const normalizedPeriods = hasNewWorkingPeriods
      ? normalizeWorkingPeriods({ batDau, ketThuc, workingPeriods })
      : null;
    const thoiGian = normalizedPeriods
      ? normalizedPeriods
          .map(({ startTime, endTime }) => `${startTime} - ${endTime}`)
          .join(", ")
      : existing.thoi_gian;
    const requestedDate = dayjs(ngayTiepDan).format("YYYY-MM-DD");
    const existingDate = dayjs(existing.ngay_tiep_dan).format("YYYY-MM-DD");
    const scheduleTimeChanged =
      requestedDate !== existingDate || thoiGian !== existing.thoi_gian;
    const workingPeriodsChanged =
      normalizedPeriods !== null && thoiGian !== existing.thoi_gian;

    if (scheduleTimeChanged) {
      const registrationCount = await ReceptionScheduleManagementRepository.countRegistrations(id);
      if (registrationCount > 0) {
        throw new BaseError(
          400,
          "Không được sửa ngày hoặc giờ vì lịch đã có đăng ký giữ chỗ"
        );
      }
    }

    const slotRows = workingPeriodsChanged
      ? buildScheduleSlotRows(normalizedPeriods, currentUser)
      : [];
    const data = await ReceptionScheduleManagementRepository.updateWithSlots(id, {
      ten_can_bo: tenCanBo,
      dia_diem: diaDiem,
      ngay_tiep_dan: ngayTiepDan,
      thoi_gian: thoiGian,
      ghi_chu: ghiChu,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    }, slotRows, workingPeriodsChanged);
    return mapCreatedSchedule(data);
  },
};

export default ReceptionScheduleManagementService;
