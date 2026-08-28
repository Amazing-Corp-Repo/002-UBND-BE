import { BaseError } from "../utils/base-error.util.js";
import FileService from "./file.service.js";
import {
  appendDeleteSuffixc,
  toSnakeCaseNonAccent,
} from "../utils/string.util.js";
import LichTiepDanRepository from "../repositories/lich-tiep-dan.repository.js";
import { createPagination } from "../utils/response.util.js";
import {
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

        const receptionDate = parseVietnamImportDate(record.ngay_tiep_dan);
        const tu = parseVietnamImportTime(record.tu);
        const den = parseVietnamImportTime(record.den);
        if (!receptionDate || !tu || !den || tu >= den) {
          throw new BaseError(400, "Ngày hoặc giờ tiếp dân trong file không hợp lệ");
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
    const finalTenCanBo = (tenCanBo && tenCanBo.trim()) || "Cán bộ tiếp dân";
    const finalDiaDiem = (diaDiem && diaDiem.trim()) || "Phòng tiếp công dân";
    const existing = await LichTiepDanRepository.findByCanBoAndNgay(
      finalTenCanBo,
      ngayTiepDan
    );
    if (existing) {
      throw new BaseError(
        400,
        "Lịch tiếp dân vào ngày này đã tồn tại"
      );
    }
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

    const duplicate = await LichTiepDanRepository.findByCanBoAndNgayExcludeId(
      finalTenCanBo,
      ngayTiepDan,
      id
    );
    if (duplicate) {
      throw new BaseError(
        400,
        "Lịch tiếp dân vào ngày này đã tồn tại"
      );
    }
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
