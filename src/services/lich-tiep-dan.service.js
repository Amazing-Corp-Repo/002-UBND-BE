import { BaseError } from "../utils/base-error.util.js";
import FileService from "./file.service.js";
import { toSnakeCaseNonAccent } from "../utils/string.util.js";
import LichTiepDanRepository from "../repositories/lich-tiep-dan.repository.js";
import dayjs from "dayjs";

const excelDateToJSDate = (serial) => {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate());
}

const LichTiepDanService = {
    async handleImport(file = []) {
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
                        thoi_gian: record.thoi_gian,
                        ghi_chu: record.ghi_chu,
                    });
                } else {
                    await LichTiepDanRepository.create({
                        ...record,
                    });
                }
            }
        } catch (error) {
            console.error("Import Error:", error);
            throw new BaseError(500, "Không thể import lịch tiếp dân");
        }
    },

    async getLichTiepDan(filters) {
        const { year, month, date } = filters;
        const data = await LichTiepDanRepository.findAll({ year, month, date });


        // 🧩 1️⃣ Nếu chỉ nhập năm → group theo tháng và trả chi tiết luôn
        if (year && !month && !date) {
            const grouped = {};

            data.forEach((item) => {
                const m = dayjs(item.ngay_tiep_dan).month() + 1;
                if (!grouped[m]) grouped[m] = [];
                grouped[m].push(item);
            });

            return Object.entries(grouped)
                .sort(([a], [b]) => Number(a) - Number(b)) // sắp xếp tháng tăng dần
                .map(([month, items]) => ({
                    month: Number(month),
                    items,
                }));
        }

        // 🧩 2️⃣ Nếu có month → trả các lịch trong tháng đó
        if (month && year && !date) {
            return data;
        }

        // 🧩 3️⃣ Nếu có date → trả đúng ngày đó
        if (date) {
            return data;
        }

        // 🧩 4️⃣ Nếu không truyền gì → trả tất cả
        return data;
    },

    async deleteLichTiepDan(id) {
        const existing = await LichTiepDanRepository.findById(id);
        if (!existing) {
            throw new BaseError(404, "Lịch tiếp dân không tồn tại");
        }
        await LichTiepDanRepository.update(id, { is_removed: true });
    },
};

export default LichTiepDanService;