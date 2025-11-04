import prisma from "../config/database.config.js";
import dayjs from "dayjs";

const LichTiepDanRepository = {
    async findByCanBoAndNgay(ten_can_bo, ngay_tiep_dan) {
        return await prisma.lich_tiep_dan.findFirst({
            where: {
                ten_can_bo,
                ngay_tiep_dan,
                is_removed: false,
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

    async findAll({ year, month, date }) {
        const where = { is_removed: false };

        if (year && !month && !date) {
            // lọc theo năm
            where.ngay_tiep_dan = {
                gte: new Date(`${year}-01-01`),
                lte: new Date(`${year}-12-31`),
            };
        } else if (year && month && !date) {
            // lọc theo tháng
            const start = dayjs(`${year}-${month}-01`).startOf("month").toDate();
            const end = dayjs(`${year}-${month}-01`).endOf("month").toDate();
            where.ngay_tiep_dan = { gte: start, lte: end };
        } else if (date) {
            // lọc chính xác theo ngày
            const start = dayjs(date).startOf("day").toDate();
            const end = dayjs(date).endOf("day").toDate();
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
    }
};

export default LichTiepDanRepository;