import { BaseError } from "../utils/base-error.util.js";
import FileService from "./file.service.js";
import {
  appendDeleteSuffixc,
  toSnakeCaseNonAccent,
} from "../utils/string.util.js";
import LichTiepDanRepository from "../repositories/lich-tiep-dan.repository.js";
import dayjs from "dayjs";
import { createPagination } from "../utils/response.util.js";
import {
  DEFAULT_RECEPTION_COUNTER_CAPACITY,
  DEFAULT_RECEPTION_WORKING_PERIODS,
  RECEPTION_COUNTER_CODES,
} from "../constants/reception-schedule.constant.js";

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
      isActive: slot.is_active,
    });
    groupedSlots.set(slot.khung_gio, current);
  });

  const { khung_gio_tiep_dan: _slots, ...scheduleData } = schedule;
  return { ...scheduleData, slots: [...groupedSlots.values()] };
};

const excelDateToJSDate = (serial) => {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(
    date_info.getUTCFullYear(),
    date_info.getUTCMonth(),
    date_info.getUTCDate()
  );
};

const sortedLichTiepDan = (data) => {
  return data.sort((a, b) => {
    const dateA = new Date(a.ngay_tiep_dan);
    const dateB = new Date(b.ngay_tiep_dan);

    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }

    const startA = a.thoi_gian.split(" - ")[0].trim();
    const startB = b.thoi_gian.split(" - ")[0].trim();

    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    return toMinutes(startA) - toMinutes(startB);
  });
};

const LichTiepDanService = {
  async handleImport(file = [], currentUser) {
    if (!file || file.length === 0) {
      throw new BaseError(400, "File không được để trống");
    }
    const data = await FileService.readSpreadsheetFile(file[0].path);
    try {
      for (const item of data) {
        const record = {};
        for (const [key, value] of Object.entries(item)) {
          record[toSnakeCaseNonAccent(key)] = value;
        }

        const rawDate = record.ngay_tiep_dan;
        let tu = new Date(record.tu).toISOString().substring(11, 16);
        let den = new Date(record.den).toISOString().substring(11, 16);
        let thoi_gian = `${tu} - ${den}`;

        switch (true) {
          case typeof rawDate === "number":
            record.ngay_tiep_dan = excelDateToJSDate(rawDate);
            break;

          case typeof rawDate === "string":
            record.ngay_tiep_dan = dayjs(rawDate, [
              "DD/MM/YYYY",
              "M/D/YYYY",
            ]).toDate();
            break;

          case rawDate instanceof Date:
            record.ngay_tiep_dan = rawDate;
            break;

          default:
            record.ngay_tiep_dan = null;
            break;
        }

        const existing = await LichTiepDanRepository.findByCanBoAndNgay(
          record.ten_can_bo,
          record.ngay_tiep_dan
        );

        if (existing) {
          await LichTiepDanRepository.update(existing.id, {
            dia_diem: record.dia_diem,
            thoi_gian: thoi_gian,
            ghi_chu: record.ghi_chu,
            nguoi_cap_nhat: currentUser,
            is_active: true,
          });
        } else {
          await LichTiepDanRepository.create({
            dia_diem: record.dia_diem,
            thoi_gian: thoi_gian,
            ghi_chu: record.ghi_chu,
            ten_can_bo: record.ten_can_bo,
            ngay_tiep_dan: record.ngay_tiep_dan,
            nguoi_tao: currentUser,
          });
        }
      }
    } catch (error) {
      console.error("Import Error:", error);
      throw new BaseError(500, "Không thể import lịch tiếp dân");
    }
    return { message: `Thêm vào thành công ${data.length} lịch tiếp dân` };
  },

  async getLichTiepDan(filters) {
    const { weekYear, monthYear, date, isActive } = filters;
    const data = await LichTiepDanRepository.findAll({
      weekYear,
      monthYear,
      date,
      isActive,
    });
    return sortedLichTiepDan(data);
  },

  async getLichTiepDanWithPagination(filters) {
    let { weekYear, monthYear, date, isActive, page, size } = filters;
    page = Number(page) || 1;
    size = Number(size) || 10;

    let { data, totalItems } =
      await LichTiepDanRepository.findAllWithPagination({
        weekYear,
        monthYear,
        date,
        isActive,
        page,
        size,
      });

    const pagination = createPagination(page, size, totalItems);
    data = sortedLichTiepDan(data);
    return { data, pagination };
  },

  async countLichTiepDan(filters) {
    const { weekYear, monthYear, date } = filters;

    const [total, active, inactive] = await Promise.all([
      LichTiepDanRepository.countAll({ weekYear, monthYear, date }),
      LichTiepDanRepository.countAll({ weekYear, monthYear, date, isActive: "true" }),
      LichTiepDanRepository.countAll({ weekYear, monthYear, date, isActive: "false" }),
    ]);

    return { total, active, inactive };
  },

  async deleteLichTiepDan(id, currentUser) {
    if (id === null || id === undefined) {
      throw new BaseError(400, "ID lịch tiếp dân không được để trống");
    }
    const existing = await LichTiepDanRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại");
    }
    if (existing.is_active === true) {
      throw new BaseError(
        400,
        "Không thể xoá lịch tiếp dân đang ở trạng thái hoạt động"
      );
    }
    await LichTiepDanRepository.update(id, {
      ten_can_bo: appendDeleteSuffixc(existing.ten_can_bo),
      is_delete: true,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    });
  },

  async updateStatusLichTiepDan(id, isActive, currentUser) {
    if (id === null || id === undefined) {
      throw new BaseError(400, "ID lịch tiếp dân không được để trống");
    }
    const existing = await LichTiepDanRepository.findById(id);
    if (!existing) {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại");
    }
    const data = await LichTiepDanRepository.update(id, {
      is_active: isActive,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    });
    return data;
  },

  async getTemplateLichTiepDan() {
    const basePath = "/static/template-lich-tiep-dan.xlsx";
    return basePath;
  },

  async getLichTiepDanById(id) {
    if (id === null || id === undefined) {
      throw new BaseError(400, "ID lịch tiếp dân không được để trống");
    }
    const data = await LichTiepDanRepository.findById(id);
    if (!data || data.is_delete) {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại");
    }
    return data;
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
    const existing = await LichTiepDanRepository.findByCanBoAndNgay(
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
    const data = await LichTiepDanRepository.createWithSlots({
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
    const existing = await LichTiepDanRepository.findById(id);
    if (!existing || existing.is_delete) {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại");
    }
    const duplicate = await LichTiepDanRepository.findByCanBoAndNgayExcludeId(
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
      const registrationCount = await LichTiepDanRepository.countRegistrations(id);
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
    const data = await LichTiepDanRepository.updateWithSlots(id, {
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

export default LichTiepDanService;
