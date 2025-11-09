import prisma from "../config/database.config.js";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";
import { BaseError } from "../utils/base-error.util.js";
dayjs.extend(isoWeek);

const LichTiepDanRepository = {
    async findByCanBoAndNgay(ten_can_bo, ngay_tiep_dan) {
        return await prisma.lich_tiep_dan.findFirst({
            where: {
                ten_can_bo,
                ngay_tiep_dan,
                is_delete: false,
            },
        });
    },

    async create(data) {
        return await prisma.lich_tiep_dan.create({ data });
    },

    async update(id, data) {
        return await prisma.lich_tiep_dan.update({
            where: { id },
            data,
        });
    },

    async findAll({ weekYear, monthYear, date, isActive }) {
        const where = {
            is_delete: false,
            ...(isActive !== undefined && isActive !== ""
                ? { is_active: isActive === "true" }
                : {}),
        };

        // 🔹 Lọc theo tuần/năm (week/year)
        if (weekYear && !monthYear && !date) {
            let [week, year] = [];
            try {
                [week, year] = weekYear.split('/'); // Tách 'tuần/năm' như '45/2025'
            } catch (error) {
                console.error("Invalid weekYear format:", weekYear);
                throw new BaseError(400, "Định dạng tuần/năm không hợp lệ");
            }
            const start = dayjs().year(year).isoWeek(week).startOf("week").toDate();
            const end = dayjs().year(year).isoWeek(week).endOf("week").toDate();
            where.ngay_tiep_dan = { gte: start, lte: end };
        }

        // 🔹 Lọc theo tháng/năm (month/year)
        else if (monthYear && !weekYear && !date) {
            let [month, year] = [];
            try {
                [month, year] = monthYear.split('/');
            }
            catch (error) {
                console.error("Invalid monthYear format:", monthYear);
                throw new BaseError(400, "Định dạng tháng/năm không hợp lệ");
            }
            const start = dayjs().year(year).month(month - 1).startOf("month").toDate(); // Month từ 0–11
            const end = dayjs().year(year).month(month - 1).endOf("month").toDate();
            where.ngay_tiep_dan = { gte: start, lte: end };
        }

        // 🔹 Lọc theo ngày (date)
        else if (date) {
            const start = dayjs(date).startOf("day").toDate(); // Cắt theo đầu ngày
            const end = dayjs(date).endOf("day").toDate(); // Cắt theo cuối ngày
            where.ngay_tiep_dan = { gte: start, lte: end };
        }

        return prisma.lich_tiep_dan.findMany({
            where,
            orderBy: { ngay_tiep_dan: "asc" },
        });
    },

    async findById(id) {
        return await prisma.lich_tiep_dan.findFirst({
            where: { id },
        });
    },

    async findByCanBoAndNgayExcludeId(ten_can_bo, ngay_tiep_dan, excludeId) {
        return await prisma.lich_tiep_dan.findFirst({
            where: {
                ten_can_bo,
                ngay_tiep_dan,
                id: { not: excludeId },
                is_delete: false,
            },
        });
    }

};

export default LichTiepDanRepository;