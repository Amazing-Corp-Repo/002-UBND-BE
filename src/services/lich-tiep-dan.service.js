import { BaseError } from "../utils/base-error.util.js";
import FileService from "./file.service.js";
import {
  appendDeleteSuffixc,
  toSnakeCaseNonAccent,
} from "../utils/string.util.js";
import LichTiepDanRepository from "../repositories/lich-tiep-dan.repository.js";
import { createPagination } from "../utils/response.util.js";
import {
  isReceptionScheduleInFuture,
  normalizeReceptionTimes,
  parseVietnamImportDate,
  parseVietnamImportTime,
  toDatabaseDate,
} from "../utils/vietnam-time.util.js";

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

const toMinutes = (time) => {
  const match = /^(\d{2}):(\d{2})$/.exec(String(time || "").trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const getTimeRange = (startTime, endTime) => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (start === null || end === null || start >= end) {
    throw new BaseError(400, "Giờ kết thúc phải sau giờ bắt đầu");
  }
  return { start, end };
};

const getStoredTimeRange = (schedule) => {
  const [startTime, endTime] = String(schedule.thoi_gian || "").split(" - ");
  try {
    return getTimeRange(startTime, endTime);
  } catch {
    return null;
  }
};

const hasSameValue = (left, right) =>
  String(left || "").trim().localeCompare(String(right || "").trim(), "vi", {
    sensitivity: "accent",
  }) === 0;

const isOverlapping = (left, right) => left.start < right.end && left.end > right.start;

const assertNoScheduleConflict = async ({ tenCanBo, diaDiem, ngayTiepDan, batDau, ketThuc, excludeId }) => {
  const requestedRange = getTimeRange(batDau, ketThuc);
  const schedules = await LichTiepDanRepository.findByNgay(ngayTiepDan, excludeId);
  const conflict = schedules.find((schedule) => {
    const existingRange = getStoredTimeRange(schedule);
    return existingRange && isOverlapping(requestedRange, existingRange) && (
      hasSameValue(schedule.ten_can_bo, tenCanBo) ||
      hasSameValue(schedule.dia_diem, diaDiem)
    );
  });

  if (!conflict) return;

  const sameOfficer = hasSameValue(conflict.ten_can_bo, tenCanBo);
  const sameLocation = hasSameValue(conflict.dia_diem, diaDiem);
  const resource = sameOfficer && sameLocation
    ? "Cán bộ và phòng tiếp dân"
    : sameOfficer
      ? "Cán bộ tiếp dân"
      : "Phòng tiếp dân";
  throw new BaseError(400, `${resource} đã có ca trực trong khung giờ đã chọn`);
};

const LichTiepDanService = {
  async handleImport(file = [], currentUser) {
    if (!file || file.length === 0) {
      throw new BaseError(400, "File không được để trống");
    }
    // Giữ ngày/giờ Excel ở dạng serial để parse theo giờ Việt Nam,
    // tránh Date bị đổi múi giờ làm lệch ngày hoặc giờ.
    const data = await FileService.readSpreadsheetFile(file[0].path, {
      cellDates: false,
    });
    try {
      for (const [index, item] of data.entries()) {
        const record = {};
        for (const [key, value] of Object.entries(item)) {
          record[toSnakeCaseNonAccent(key)] = value;
        }

        const receptionDate = parseVietnamImportDate(record.ngay_tiep_dan);
        const tu = parseVietnamImportTime(record.tu);
        const den = parseVietnamImportTime(record.den);
        if (!receptionDate || !tu || !den || tu >= den) {
          throw new BaseError(400, "Ngày hoặc giờ tiếp dân trong file không hợp lệ");
        }
        if (!isReceptionScheduleInFuture({ receptionDate, startTime: tu })) {
          throw new BaseError(
            400,
            `Dòng ${index + 2}: Ngày và giờ tiếp dân phải ở hiện tại hoặc trong tương lai`
          );
        }
        record.ngay_tiep_dan = toDatabaseDate(receptionDate);
        const thoi_gian = `${tu} - ${den}`;
        const officerName = String(record.ten_can_bo || record.ho_ten_can_bo || "Cán bộ tiếp dân").trim();
        const location = String(record.dia_diem || "Phòng tiếp công dân").trim();
        const existing = await LichTiepDanRepository.findByCanBoAndNgay(
          officerName,
          record.ngay_tiep_dan
        );

        if (existing) {
          await LichTiepDanRepository.update(existing.id, {
            dia_diem: location,
            thoi_gian: thoi_gian,
            ghi_chu: record.ghi_chu,
            nguoi_cap_nhat: currentUser,
            is_active: true,
          });
        } else {
          await LichTiepDanRepository.create({
            thoi_gian: thoi_gian,
            ghi_chu: record.ghi_chu,
            ten_can_bo: officerName,
            dia_diem: location,
            ngay_tiep_dan: record.ngay_tiep_dan,
            nguoi_tao: currentUser,
          });
        }
      }
    } catch (error) {
      console.error("Import Error:", error);
      if (error instanceof BaseError) throw error;
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
    return normalizeReceptionTimes(sortedLichTiepDan(data));
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
    return normalizeReceptionTimes({ data, pagination });
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
    const timeRange = getStoredTimeRange(existing);
    const startTime = String(existing.thoi_gian || "").split(" - ")[0]?.trim();
    if (!timeRange || !isReceptionScheduleInFuture({
      receptionDate: existing.ngay_tiep_dan,
      startTime,
    })) {
      throw new BaseError(400, "Không thể xoá lịch tiếp dân đã diễn ra hoặc đang diễn ra");
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
    return normalizeReceptionTimes(data);
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
    return normalizeReceptionTimes(data);
  },

  async createLichTiepDan(
    tenCanBo,
    diaDiem,
    ngayTiepDan,
    batDau,
    ketThuc,
    ghiChu,
    currentUser
  ) {
    if (!isReceptionScheduleInFuture({ receptionDate: ngayTiepDan, startTime: batDau })) {
      throw new BaseError(
        400,
        "Ngày và giờ tiếp dân phải ở hiện tại hoặc trong tương lai"
      );
    }
    const finalTenCanBo = (tenCanBo && tenCanBo.trim()) || "Cán bộ tiếp dân";
    const finalDiaDiem = (diaDiem && diaDiem.trim()) || "Phòng tiếp công dân";
    await assertNoScheduleConflict({
      tenCanBo: finalTenCanBo,
      diaDiem: finalDiaDiem,
      ngayTiepDan,
      batDau,
      ketThuc,
    });
    let thoiGian = `${batDau} - ${ketThuc}`;
    const data = await LichTiepDanRepository.create({
      ten_can_bo: finalTenCanBo,
      dia_diem: finalDiaDiem,
      ngay_tiep_dan: ngayTiepDan,
      thoi_gian: thoiGian,
      ghi_chu: ghiChu,
      nguoi_tao: currentUser,
    });
    return normalizeReceptionTimes(data);
  },

  async updateLichTiepDan(
    id,
    tenCanBo,
    diaDiem,
    ngayTiepDan,
    batDau,
    ketThuc,
    ghiChu,
    currentUser
  ) {
    if (id === null || id === undefined) {
      throw new BaseError(400, "ID lịch tiếp dân không được để trống");
    }
    const existing = await LichTiepDanRepository.findById(id);
    if (!existing || existing.is_delete) {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại");
    }
    const finalTenCanBo = (tenCanBo && tenCanBo.trim()) || existing.ten_can_bo || "Cán bộ tiếp dân";
    const finalDiaDiem = (diaDiem && diaDiem.trim()) || existing.dia_diem || "Phòng tiếp công dân";

    await assertNoScheduleConflict({
      tenCanBo: finalTenCanBo,
      diaDiem: finalDiaDiem,
      ngayTiepDan,
      batDau,
      ketThuc,
      excludeId: id,
    });
    let thoiGian = `${batDau} - ${ketThuc}`;
    const data = await LichTiepDanRepository.update(id, {
      ten_can_bo: finalTenCanBo,
      dia_diem: finalDiaDiem,
      ngay_tiep_dan: ngayTiepDan,
      thoi_gian: thoiGian,
      ghi_chu: ghiChu,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    });
    return normalizeReceptionTimes(data);
  },
};

export default LichTiepDanService;
