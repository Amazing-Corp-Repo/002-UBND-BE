import { BaseError } from "../utils/base-error.util.js";
import {
  DEFAULT_RECEPTION_COUNTER_CAPACITY,
  DEFAULT_RECEPTION_WORKING_PERIODS,
  RECEPTION_COUNTER_CODES,
} from "../constants/reception-schedule.constant.js";
import ReceptionScheduleManagementRepository from "../repositories/reception-schedule-management.repository.js";
import UserRepository from "../repositories/user.repository.js";
import LichTiepDanService from "./lich-tiep-dan.service.js";
import FileService from "./file.service.js";
import { PERMISSION } from "../constants/permission.constant.js";
import {
  appendDeleteSuffixc,
  toSnakeCaseNonAccent,
} from "../utils/string.util.js";
import { createPagination } from "../utils/response.util.js";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  formatVietnamDate,
  normalizeReceptionTimes,
  parseVietnamImportDate,
  parseVietnamImportTime,
  toDatabaseDate,
} from "../utils/vietnam-time.util.js";

const RECEPTION_TEMPLATE_URL = "/static/template-lich-tiep-dan.xlsx";
const RECEPTION_TEMPLATE_PATH = fileURLToPath(
  new URL("../public/static/template-lich-tiep-dan.xlsx", import.meta.url)
);

const toMinutes = (value) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;

const buildHourlyTimeSlots = (periods) =>
  periods.flatMap(({ startTime, endTime }) => {
    const slots = [];
    const end = toMinutes(endTime);
    for (let current = toMinutes(startTime); current < end; current += 60) {
      slots.push(`${toTime(current)} - ${toTime(current + 60)}`);
    }
    return slots;
  });

const normalizeImportCapacity = (value, rowNumber) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  const capacity = Number(value);
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new BaseError(
      400,
      `Dòng ${rowNumber}: Sức chứa / ca phải là số nguyên từ 1 trở lên`
    );
  }
  return capacity;
};

const normalizeImportRow = (item, index) => {
  const row = Object.fromEntries(
    Object.entries(item).map(([key, value]) => [toSnakeCaseNonAccent(key), value])
  );
  const rowNumber = index + 2;
  const officerUsername = String(row.tai_khoan_can_bo || "").trim();
  const officerDisplayName = String(row.ho_ten_can_bo || "").trim();
  const counterCode = String(row.ma_quay || "").trim().toUpperCase();
  const location = String(row.dia_diem || "").trim();
  const receptionDate = parseVietnamImportDate(row.ngay_tiep_dan);
  const startTime = parseVietnamImportTime(row.tu);
  const endTime = parseVietnamImportTime(row.den);

  if (
    !officerUsername ||
    !counterCode ||
    !location ||
    !receptionDate ||
    !startTime ||
    !endTime
  ) {
    throw new BaseError(
      400,
      `Dòng ${rowNumber} thiếu hoặc sai địa điểm, mã quầy, tài khoản cán bộ, ngày hoặc thời gian trực`
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
  return {
    rowNumber,
    officerUsername,
    officerDisplayName,
    counterCode,
    capacity: normalizeImportCapacity(row.suc_chua_ca, rowNumber),
    location,
    receptionDate,
    periods,
    note: row.ghi_chu ? String(row.ghi_chu).trim() : null,
  };
};

const shuffle = (items, random) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const getImportSessionKey = (row) => {
  const periodKey = row.periods
    .map(({ startTime, endTime }) => `${startTime}-${endTime}`)
    .join("|");
  const startsInMorning = row.periods.every(
    ({ startTime }) => toMinutes(startTime) < 12 * 60
  );
  const endsInMorning = row.periods.every(
    ({ endTime }) => toMinutes(endTime) <= 12 * 60
  );
  const startsInAfternoon = row.periods.every(
    ({ startTime }) => toMinutes(startTime) >= 12 * 60
  );
  const session = startsInMorning && endsInMorning
    ? "MORNING"
    : startsInAfternoon
      ? "AFTERNOON"
      : `CUSTOM:${periodKey}`;
  return [
    row.receptionDate,
    row.location.toLocaleLowerCase("vi"),
    session,
  ].join("::");
};

export const randomizeImportOfficerAssignments = (
  rows,
  random = Math.random
) => {
  const randomizedRows = rows.map((row) => ({ ...row }));
  const groups = new Map();

  randomizedRows.forEach((row, index) => {
    const groupKey = getImportSessionKey(row);
    const indexes = groups.get(groupKey) || [];
    indexes.push(index);
    groups.set(groupKey, indexes);
  });

  groups.forEach((indexes) => {
    const officers = shuffle(
      indexes.map((index) => ({
        officerUsername: randomizedRows[index].officerUsername,
        officerDisplayName: randomizedRows[index].officerDisplayName,
      })),
      random
    );

    indexes.forEach((rowIndex, officerIndex) => {
      randomizedRows[rowIndex].officerUsername =
        officers[officerIndex].officerUsername;
      randomizedRows[rowIndex].officerDisplayName =
        officers[officerIndex].officerDisplayName;
    });
  });

  return randomizedRows;
};

export const expandImportRowsForAllSessionCounters = (
  { rows, users, counters },
  random = Math.random
) => {
  if (users.length < counters.length) {
    throw new BaseError(
      400,
      `File chỉ có ${users.length} cán bộ hợp lệ nhưng cần ít nhất ${counters.length} cán bộ để xếp đủ các quầy trong mỗi buổi`
    );
  }

  const groups = new Map();
  rows.forEach((row) => {
    const key = getImportSessionKey(row);
    const groupRows = groups.get(key) || [];
    groupRows.push(row);
    groups.set(key, groupRows);
  });

  return [...groups.values()].flatMap((groupRows) => {
    const shuffledUsers = shuffle(users, random).slice(0, counters.length);
    const starts = groupRows.flatMap((row) =>
      row.periods.map(({ startTime }) => startTime)
    );
    const ends = groupRows.flatMap((row) =>
      row.periods.map(({ endTime }) => endTime)
    );
    const period = {
      startTime: starts.sort((left, right) => toMinutes(left) - toMinutes(right))[0],
      endTime: ends.sort((left, right) => toMinutes(right) - toMinutes(left))[0],
    };
    const baseRow = groupRows[0];

    return counters.map((counter, index) => {
      const sourceRow = groupRows.find(
        (row) => row.counterCode === counter.ma_quay
      );
      const officer = shuffledUsers[index];
      return {
        ...baseRow,
        rowNumber: sourceRow?.rowNumber ?? null,
        counterCode: counter.ma_quay,
        officerUsername: officer.ten_dang_nhap,
        officerDisplayName: officer.ho_va_ten || officer.ten_dang_nhap,
        capacity: sourceRow?.capacity ?? null,
        note: sourceRow?.note ?? baseRow.note,
        periods: [period],
      };
    });
  });
};

const hasPermission = (user, permissionCode) =>
  user.user_roles?.some(
    ({ roles }) =>
      roles?.is_active !== false &&
      roles?.is_delete !== true &&
      roles?.role_permissions?.some(
        ({ permission_code: code }) => code === permissionCode
      )
  );

const buildImportRecords = ({ rows, users, counters, currentUser }) => {
  const userMap = new Map(
    users.map((user) => [user.ten_dang_nhap.toLocaleLowerCase("vi"), user])
  );
  const counterMap = new Map(
    counters.map((counter) => [counter.ma_quay.toUpperCase(), counter])
  );
  const groups = new Map();

  for (const row of rows) {
    const user = userMap.get(row.officerUsername.toLocaleLowerCase("vi"));
    if (!user) {
      throw new BaseError(
        400,
        `Dòng ${row.rowNumber}: Tài khoản cán bộ '${row.officerUsername}' không tồn tại hoặc đã ngừng hoạt động`
      );
    }
    if (!hasPermission(user, PERMISSION.RR_APPROVE)) {
      throw new BaseError(
        400,
        `Dòng ${row.rowNumber}: Tài khoản '${row.officerUsername}' chưa có quyền RR_APPROVE`
      );
    }

    const counter = counterMap.get(row.counterCode);
    if (!counter) {
      throw new BaseError(
        400,
        `Dòng ${row.rowNumber}: Mã quầy '${row.counterCode}' không tồn tại hoặc đã ngừng hoạt động`
      );
    }

    const groupKey = `${row.receptionDate}::${row.location.toLocaleLowerCase("vi")}`;
    const group = groups.get(groupKey) || {
      location: row.location,
      receptionDate: row.receptionDate,
      periods: new Map(),
      notes: new Set(),
      officers: new Map(),
      counterSlots: new Map(),
      officerSlots: new Map(),
      slotRows: [],
      assignmentRows: [],
    };
    if (row.note) group.notes.add(row.note);
    group.officers.set(user.id, user.ho_va_ten || user.ten_dang_nhap);

    for (const period of row.periods) {
      group.periods.set(
        `${period.startTime}-${period.endTime}`,
        period
      );
    }

    for (const timeSlot of buildHourlyTimeSlots(row.periods)) {
      const counterSlotKey = `${timeSlot}::${counter.ma_quay}`;
      if (group.counterSlots.has(counterSlotKey)) {
        throw new BaseError(
          409,
          `Dòng ${row.rowNumber}: Quầy ${counter.ma_quay} đã có cán bộ trực trong ca ${timeSlot}`
        );
      }
      const officerSlotKey = `${timeSlot}::${user.id}`;
      const existingCounter = group.officerSlots.get(officerSlotKey);
      if (existingCounter) {
        throw new BaseError(
          409,
          `Dòng ${row.rowNumber}: Cán bộ '${user.ten_dang_nhap}' đã được phân công ${existingCounter} trong ca ${timeSlot}`
        );
      }

      group.counterSlots.set(counterSlotKey, row.rowNumber);
      group.officerSlots.set(officerSlotKey, counter.ma_quay);
      group.slotRows.push({
        khung_gio: timeSlot,
        ma_quay: counter.ma_quay,
        suc_chua:
          row.capacity ??
          counter.suc_chua_mac_dinh ??
          DEFAULT_RECEPTION_COUNTER_CAPACITY,
        nguoi_tao: currentUser,
      });
      group.assignmentRows.push({
        khung_gio: timeSlot,
        ma_quay: counter.ma_quay,
        officerId: user.id,
      });
    }
    groups.set(groupKey, group);
  }

  return [...groups.values()].map((group) => {
    const periods = [...group.periods.values()].sort(
      (left, right) => toMinutes(left.startTime) - toMinutes(right.startTime)
    );
    return {
      location: group.location,
      receptionDate: group.receptionDate,
      scheduleData: {
        ten_can_bo: [...group.officers.values()].join(", ").slice(0, 255),
        dia_diem: group.location,
        ngay_tiep_dan: toDatabaseDate(group.receptionDate),
        thoi_gian: periods
          .map(({ startTime, endTime }) => `${startTime} - ${endTime}`)
          .join(", "),
        ghi_chu: [...group.notes].join("; ").slice(0, 255) || null,
        nguoi_tao: currentUser,
      },
      slotRows: group.slotRows,
      assignmentRows: group.assignmentRows,
    };
  });
};

const buildImportedRowDetails = ({ rows, users, counters }) => {
  const userMap = new Map(
    users.map((user) => [user.ten_dang_nhap.toLocaleLowerCase("vi"), user])
  );
  const counterMap = new Map(
    counters.map((counter) => [counter.ma_quay.toUpperCase(), counter])
  );

  return rows.map((row) => {
    const user = userMap.get(row.officerUsername.toLocaleLowerCase("vi"));
    const counter = counterMap.get(row.counterCode);
    const period = row.periods[0];

    return {
      rowNumber: row.rowNumber,
      receptionDate: row.receptionDate,
      startTime: period.startTime,
      endTime: period.endTime,
      counterCode: counter.ma_quay,
      counterName: counter.ten_quay,
      officerUsername: user.ten_dang_nhap,
      officerFullName: user.ho_va_ten || user.ten_dang_nhap,
      capacity:
        row.capacity ??
        counter.suc_chua_mac_dinh ??
        DEFAULT_RECEPTION_COUNTER_CAPACITY,
      location: row.location,
      note: row.note,
    };
  });
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
  const timeSlots = buildHourlyTimeSlots(periods);

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
      shiftId: slot.id_ca_tiep_dan || null,
      counterId: slot.quay_tiep_dan?.id || slot.id_quay || null,
      counterCode: slot.quay_tiep_dan?.ma_quay || slot.ma_quay,
      counterName: slot.quay_tiep_dan?.ten_quay || null,
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

    const counter = registration.id_cau_hinh_quay
      ? slot.counters.find((item) => item.id === registration.id_cau_hinh_quay)
      : slot.counters.find((item) => item.counterCode === registration.bo_phan);
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
  return normalizeReceptionTimes({
    ...scheduleData,
    slots: [...groupedSlots.values()],
  });
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
    return normalizeReceptionTimes(data.sort((left, right) => {
      const dateDifference =
        new Date(left.ngay_tiep_dan).getTime() -
        new Date(right.ngay_tiep_dan).getTime();
      if (dateDifference !== 0) return dateDifference;
      return String(left.thoi_gian || "").localeCompare(
        String(right.thoi_gian || "")
      );
    }));
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
    return normalizeReceptionTimes({
      data,
      pagination: createPagination(page, size, totalItems),
    });
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

  async updateStatusLichTiepDan(id, isActive, currentUser) {
    const result =
      await ReceptionScheduleManagementRepository.updateStatusIfAllowed(
        id,
        isActive,
        {
          nguoi_cap_nhat: currentUser,
          thoi_gian_cap_nhat: new Date(),
        }
      );
    if (result.status === "NOT_FOUND") {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại");
    }
    if (result.status === "HAS_REGISTRATIONS") {
      throw new BaseError(
        409,
        "Không thể ngừng lịch tiếp dân đã có đăng ký giữ chỗ"
      );
    }
    return normalizeReceptionTimes(result.data);
  },

  async getTemplateLichTiepDan() {
    try {
      await access(RECEPTION_TEMPLATE_PATH);
    } catch {
      throw new BaseError(500, "File mẫu import lịch tiếp dân không tồn tại");
    }
    return RECEPTION_TEMPLATE_URL;
  },

  async handleImport(files = [], currentUser, overwrite = false) {
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

    const sourceRows = nonEmptyRows.map((row, index) =>
      normalizeImportRow(row, index)
    );
    const [users, counters] = await Promise.all([
      UserRepository.findActiveByUsernames([
        ...new Set(sourceRows.map((row) => row.officerUsername)),
      ]),
      ReceptionScheduleManagementRepository.findActiveCountersByCodes([
        ...new Set(sourceRows.map((row) => row.counterCode)),
      ]),
    ]);
    buildImportRecords({ rows: sourceRows, users, counters, currentUser });
    const rows = expandImportRowsForAllSessionCounters({
      rows: sourceRows,
      users,
      counters: [...counters].sort((left, right) =>
        left.ma_quay.localeCompare(right.ma_quay, "vi", { numeric: true })
      ),
    });
    const records = buildImportRecords({ rows, users, counters, currentUser });
    const importedRows = buildImportedRowDetails({ rows, users, counters });

    let overwrittenCount = 0;
    if (overwrite) {
      const overwriteResult =
        await ReceptionScheduleManagementRepository.overwriteManyWithSlots(records);
      if (overwriteResult.status === "HAS_REGISTRATIONS") {
        throw new BaseError(
          409,
          "Không thể ghi đè lịch tiếp dân đã có đơn đăng ký"
        );
      }
      overwrittenCount = overwriteResult.overwrittenCount;
    } else {
      const conflicts =
        await ReceptionScheduleManagementRepository.findImportConflicts(records);
      if (conflicts.length > 0) {
        throw new BaseError(409, "Lịch của cán bộ trong ngày tiếp dân đã tồn tại");
      }
      await ReceptionScheduleManagementRepository.createManyWithSlots(records);
    }
    const totalCounterSlots = records.reduce(
      (total, record) => total + record.slotRows.length,
      0
    );
    const importedDates = [
      ...new Set(importedRows.map((row) => row.receptionDate)),
    ].sort();
    return {
      assignmentMode: "RANDOM",
      assignmentScope: "SESSION",
      overwriteApplied: overwrite,
      overwrittenCount,
      importedCount: records.length,
      importedRowCount: sourceRows.length,
      generatedAssignmentRowCount: rows.length,
      totalCounterSlots,
      totalAssignments: records.reduce(
        (total, record) => total + record.assignmentRows.length,
        0
      ),
      dateFrom: importedDates[0],
      dateTo: importedDates[importedDates.length - 1],
      importedDates,
      importedRows,
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
    const requestedDate = formatVietnamDate(ngayTiepDan);
    const existingDate = formatVietnamDate(existing.ngay_tiep_dan);
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
