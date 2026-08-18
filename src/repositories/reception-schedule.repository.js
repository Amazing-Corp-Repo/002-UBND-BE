import prisma from "../config/database.config.js";

const ReceptionScheduleRepository = {
  async findActiveBetweenDates(fromDate, toDate) {
    return prisma.lich_tiep_dan.findMany({
      where: {
        is_active: true,
        is_delete: false,
        ngay_tiep_dan: {
          gte: new Date(`${fromDate}T00:00:00.000Z`),
          lte: new Date(`${toDate}T23:59:59.999Z`),
        },
      },
      orderBy: [{ ngay_tiep_dan: "asc" }, { thoi_gian: "asc" }],
      include: {
        khung_gio_tiep_dan: {
          where: { is_active: true, is_delete: false },
          orderBy: [{ khung_gio: "asc" }, { ma_quay: "asc" }],
        },
        dang_ky_tiep_dan: {
          select: { slot: true },
        },
      },
    });
  },
};

export default ReceptionScheduleRepository;
