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

  async findManagement({
    page,
    size,
    fromDate,
    toDate,
    isActive,
    search,
    leaderId,
  }) {
    const where = {
      is_delete: false,
      id_lanh_dao: leaderId || undefined,
      is_active: isActive,
      ngay:
        fromDate || toDate
          ? {
              gte: fromDate
                ? new Date(`${fromDate}T00:00:00.000Z`)
                : undefined,
              lte: toDate
                ? new Date(`${toDate}T23:59:59.999Z`)
                : undefined,
            }
          : undefined,
      lanh_dao: {
        is_delete: false,
        ...(search
          ? { ho_va_ten: { contains: search, mode: "insensitive" } }
          : {}),
      },
    };

    const [data, totalItems] = await Promise.all([
      prisma.lich_gap_lanh_dao.findMany({
        where,
        orderBy: [{ ngay: "desc" }, { thoi_gian_tao: "desc" }],
        skip: (page - 1) * size,
        take: size,
        select: {
          id: true,
          ngay: true,
          dia_diem: true,
          ghi_chu: true,
          is_active: true,
          thoi_gian_tao: true,
          thoi_gian_cap_nhat: true,
          lanh_dao: { select: { id: true, ho_va_ten: true } },
          khung_gio_gap_lanh_dao: {
            where: { is_delete: false },
            orderBy: [{ gio_bat_dau: "asc" }],
            select: {
              id: true,
              gio_bat_dau: true,
              gio_ket_thuc: true,
              suc_chua: true,
              is_active: true,
              dang_ky_gap_lanh_dao: {
                where: { is_active: true, is_delete: false },
                select: { id: true, trang_thai: true },
              },
            },
          },
        },
      }),
      prisma.lich_gap_lanh_dao.count({ where }),
    ]);

    return { data, totalItems };
  },

  async findManagementDetail(id, leaderId) {
    return prisma.lich_gap_lanh_dao.findFirst({
      where: {
        id,
        id_lanh_dao: leaderId || undefined,
        is_delete: false,
      },
      select: {
        id: true,
        ngay: true,
        dia_diem: true,
        ghi_chu: true,
        is_active: true,
        thoi_gian_tao: true,
        thoi_gian_cap_nhat: true,
        lanh_dao: {
          select: { id: true, ho_va_ten: true, email: true, so_dien_thoai: true },
        },
        khung_gio_gap_lanh_dao: {
          where: { is_delete: false },
          orderBy: [{ gio_bat_dau: "asc" }, { gio_ket_thuc: "asc" }],
          select: {
            id: true,
            gio_bat_dau: true,
            gio_ket_thuc: true,
            suc_chua: true,
            is_active: true,
            dang_ky_gap_lanh_dao: {
              where: { is_active: true, is_delete: false },
              select: { id: true, trang_thai: true },
            },
          },
        },
      },
    });
  },

  async createManagement(data) {
    return prisma.lich_gap_lanh_dao.create({
      data: {
        id_lanh_dao: data.leaderId,
        ngay: data.receptionDate,
        dia_diem: data.location,
        ghi_chu: data.note,
        nguoi_tao: data.leaderId,
        nguoi_cap_nhat: data.leaderId,
        khung_gio_gap_lanh_dao: {
          create: data.slots.map((slot) => ({
            gio_bat_dau: slot.startTime,
            gio_ket_thuc: slot.endTime,
            suc_chua: 1,
            nguoi_tao: data.leaderId,
            nguoi_cap_nhat: data.leaderId,
          })),
        },
      },
      select: { id: true },
    });
  },

  async updateManagement(id, leaderId, data) {
    return prisma.$transaction(async (tx) => {
      const schedule = await tx.lich_gap_lanh_dao.findFirst({
        where: { id, id_lanh_dao: leaderId, is_delete: false },
        select: {
          id: true,
          khung_gio_gap_lanh_dao: {
            select: {
              id: true,
              gio_bat_dau: true,
              gio_ket_thuc: true,
              is_delete: true,
            },
          },
        },
      });
      if (!schedule) return { conflict: "NOT_FOUND" };

      const registrationCount = await tx.dang_ky_gap_lanh_dao.count({
        where: {
          khung_gio_gap_lanh_dao: { id_lich_gap: id },
          is_active: true,
          is_delete: false,
        },
      });
      if (registrationCount > 0) return { conflict: "HAS_REGISTRATIONS" };

      const desiredKeys = new Set(
        data.slots.map((slot) => `${slot.startTime}|${slot.endTime}`)
      );
      const existingByKey = new Map(
        schedule.khung_gio_gap_lanh_dao.map((slot) => [
          `${slot.gio_bat_dau}|${slot.gio_ket_thuc}`,
          slot,
        ])
      );

      for (const slot of schedule.khung_gio_gap_lanh_dao) {
        const key = `${slot.gio_bat_dau}|${slot.gio_ket_thuc}`;
        if (!desiredKeys.has(key) && !slot.is_delete) {
          await tx.khung_gio_gap_lanh_dao.update({
            where: { id: slot.id },
            data: {
              is_active: false,
              is_delete: true,
              nguoi_cap_nhat: leaderId,
              thoi_gian_cap_nhat: new Date().toISOString(),
            },
          });
        }
      }

      for (const slot of data.slots) {
        const key = `${slot.startTime}|${slot.endTime}`;
        const existing = existingByKey.get(key);
        if (existing) {
          await tx.khung_gio_gap_lanh_dao.update({
            where: { id: existing.id },
            data: {
              is_active: true,
              is_delete: false,
              nguoi_cap_nhat: leaderId,
              thoi_gian_cap_nhat: new Date().toISOString(),
            },
          });
        } else {
          await tx.khung_gio_gap_lanh_dao.create({
            data: {
              id_lich_gap: id,
              gio_bat_dau: slot.startTime,
              gio_ket_thuc: slot.endTime,
              suc_chua: 1,
              nguoi_tao: leaderId,
              nguoi_cap_nhat: leaderId,
            },
          });
        }
      }

      await tx.lich_gap_lanh_dao.update({
        where: { id },
        data: {
          ngay: data.receptionDate,
          dia_diem: data.location,
          ghi_chu: data.note,
          nguoi_cap_nhat: leaderId,
          thoi_gian_cap_nhat: new Date().toISOString(),
        },
      });
      return { updated: true };
    }, { isolationLevel: "Serializable", maxWait: 15000, timeout: 30000 });
  },

  async updateManagementStatus(id, leaderId, isActive) {
    return prisma.$transaction(async (tx) => {
      const schedule = await tx.lich_gap_lanh_dao.findFirst({
        where: { id, id_lanh_dao: leaderId, is_delete: false },
        select: { id: true, is_active: true },
      });
      if (!schedule) return { conflict: "NOT_FOUND" };

      const registrationCount = await tx.dang_ky_gap_lanh_dao.count({
        where: {
          khung_gio_gap_lanh_dao: { id_lich_gap: id },
          is_active: true,
          is_delete: false,
        },
      });
      if (registrationCount > 0) return { conflict: "HAS_REGISTRATIONS" };

      await tx.lich_gap_lanh_dao.update({
        where: { id },
        data: {
          is_active: isActive,
          nguoi_cap_nhat: leaderId,
          thoi_gian_cap_nhat: new Date().toISOString(),
        },
      });
      return { updated: true };
    }, { isolationLevel: "Serializable" });
  },
};

export default LeaderMeetingScheduleRepository;
