import { BaseError } from "../utils/base-error.util.js";
import FileService from "./file.service.js";
import { appendDeleteSuffixc, toSnakeCaseNonAccent } from "../utils/string.util.js";
import LichTiepDanRepository from "../repositories/lich-tiep-dan.repository.js";
import dayjs from "dayjs";
import path from "path";

const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate());
}

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
                console.log(thoi_gian);

                switch (true) {
                    case typeof rawDate === "number":
                        record.ngay_tiep_dan = excelDateToJSDate(rawDate);
                        break;

                    case typeof rawDate === "string":
                        record.ngay_tiep_dan = dayjs(rawDate, ["DD/MM/YYYY", "M/D/YYYY"]).toDate();
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
    },

    async getLichTiepDan(filters) {
        const { weekYear, monthYear, date, isActive } = filters;
        const data = await LichTiepDanRepository.findAll({ weekYear, monthYear, date, isActive });

        if (weekYear && !monthYear && !date) {
            return data;
        }

        if (monthYear && !weekYear && !date) {
            return data;
        }

        if (date) {
            return data;
        }

        return data;
    },

    async deleteLichTiepDan(id, currentUser) {
        const existing = await LichTiepDanRepository.findById(id);
        if (!existing) {
            throw new BaseError(404, "Lịch tiếp dân không tồn tại");
        }
        if (existing.is_active === true) {
            throw new BaseError(400, "Không thể xoá lịch tiếp dân đang ở trạng thái hoạt động");
        }
        await LichTiepDanRepository.update(id, {
            ten_can_bo: appendDeleteSuffixc(existing.ten_can_bo),
            is_delete: true,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        });
    },

    async updateLichTiepDan(id, isActive, currentUser) {
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
        const basePath = '/static/template-lich-tiep-dan.xlsx';
        return basePath;
    },

    async getLichTiepDanById(id) {
        const data = await LichTiepDanRepository.findById(id);
        if (!data || data.is_delete) {
            throw new BaseError(404, "Lịch tiếp dân không tồn tại");
        }
        return data;
    },
};

export default LichTiepDanService;