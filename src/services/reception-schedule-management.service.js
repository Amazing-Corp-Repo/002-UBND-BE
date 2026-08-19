import dayjs from "dayjs";
import { BaseError } from "../utils/base-error.util.js";
import {
  DEFAULT_RECEPTION_COUNTER_CAPACITY,
  DEFAULT_RECEPTION_WORKING_PERIODS,
  RECEPTION_COUNTER_CODES,
} from "../constants/reception-schedule.constant.js";
import ReceptionScheduleManagementRepository from "../repositories/reception-schedule-management.repository.js";
import LichTiepDanService from "./lich-tiep-dan.service.js";

const toMinutes = (value) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};

const toTime = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60
  ).padStart(2, "0")}`;

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
