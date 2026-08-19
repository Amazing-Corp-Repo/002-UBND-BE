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
        ca_tiep_dan: {
          where: { is_active: true, is_delete: false },
          orderBy: [{ gio_bat_dau: "asc" }],
          select: {
            id: true,
            gio_bat_dau: true,
            gio_ket_thuc: true,
          },
        },
        khung_gio_tiep_dan: {
          where: { is_active: true, is_delete: false },
          orderBy: [{ khung_gio: "asc" }, { ma_quay: "asc" }],
          select: {
            id: true,
            khung_gio: true,
            ma_quay: true,
            id_quay: true,
            id_ca_tiep_dan: true,
            suc_chua: true,
            is_active: true,
          },
        },
        dang_ky_tiep_dan: {
          where: { loai: "COUNTER_RECEPTION" },
          select: { slot: true },
        },
      },
    });
  },

  async updateSlotCapacity(scheduleId, slotId, capacity, currentUser) {
    return prisma.$transaction(async (tx) => {
      const slot = await tx.khung_gio_tiep_dan.findFirst({
        where: {
          id: slotId,
          id_lich_tiep_dan: scheduleId,
          is_active: true,
          is_delete: false,
        },
      });
      if (!slot) return { conflict: "SLOT_NOT_FOUND" };

      const [scheduleSlots, heldCount, assignedCount] = await Promise.all([
        tx.khung_gio_tiep_dan.findMany({
          where: {
            id_lich_tiep_dan: scheduleId,
            khung_gio: slot.khung_gio,
            is_active: true,
            is_delete: false,
          },
          select: { suc_chua: true },
        }),
        tx.dang_ky_tiep_dan.count({
          where: {
            loai: "COUNTER_RECEPTION",
            id_lich_tiep_dan: scheduleId,
            slot: slot.khung_gio,
          },
        }),
        tx.dang_ky_tiep_dan.count({
          where: {
            loai: "COUNTER_RECEPTION",
            OR: [
              { id_cau_hinh_quay: slot.id },
              {
                id_cau_hinh_quay: null,
                id_lich_tiep_dan: scheduleId,
                slot: slot.khung_gio,
                bo_phan: slot.ma_quay,
              },
            ],
          },
        }),
      ]);

      if (capacity < assignedCount) return { conflict: "BELOW_COUNTER_HELD" };
      const currentTotalCapacity = scheduleSlots.reduce(
        (total, item) => total + item.suc_chua,
        0
      );
      const newTotalCapacity = currentTotalCapacity - slot.suc_chua + capacity;
      if (newTotalCapacity < heldCount) return { conflict: "BELOW_SLOT_HELD" };

      const updated = await tx.khung_gio_tiep_dan.update({
        where: { id: slotId },
        data: {
          suc_chua: capacity,
          nguoi_cap_nhat: currentUser,
          thoi_gian_cap_nhat: new Date().toISOString(),
        },
      });
      return {
        slot: updated,
        assignedCount,
        heldCount,
        totalCapacity: newTotalCapacity,
      };
    }, { isolationLevel: "Serializable" });
  },
};

export default ReceptionScheduleRepository;
