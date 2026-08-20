import prisma from "../config/database.config.js";

const LeaderMeetingScheduleRepository = {
  async findAvailableBetweenDates({ fromDate, toDate, leaderId }) {
    return prisma.lich_gap_lanh_dao.findMany({
      where: {
        is_active: true,
        is_delete: false,
        id_lanh_dao: leaderId || undefined,
        ngay: {
          gte: new Date(`${fromDate}T00:00:00.000Z`),
          lte: new Date(`${toDate}T23:59:59.999Z`),
        },
        lanh_dao: {
          is_active: true,
          is_delete: false,
        },
      },
      orderBy: [{ ngay: "asc" }, { id_lanh_dao: "asc" }],
      select: {
        id: true,
        id_lanh_dao: true,
        ngay: true,
        dia_diem: true,
        ghi_chu: true,
        lanh_dao: {
          select: {
            id: true,
            ho_va_ten: true,
          },
        },
        khung_gio_gap_lanh_dao: {
          where: { is_active: true, is_delete: false },
          orderBy: [{ gio_bat_dau: "asc" }, { gio_ket_thuc: "asc" }],
          select: {
            id: true,
            gio_bat_dau: true,
            gio_ket_thuc: true,
            suc_chua: true,
            dang_ky_gap_lanh_dao: {
              where: { is_active: true, is_delete: false },
              select: { id: true },
            },
          },
        },
      },
    });
  },
};

export default LeaderMeetingScheduleRepository;
