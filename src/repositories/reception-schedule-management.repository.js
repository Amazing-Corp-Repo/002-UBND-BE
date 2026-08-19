import prisma from "../config/database.config.js";
import LichTiepDanRepository from "./lich-tiep-dan.repository.js";

const ReceptionScheduleManagementRepository = {
  ...LichTiepDanRepository,

  async createWithSlots(scheduleData, slotRows) {
    return prisma.$transaction(async (tx) => {
      const schedule = await tx.lich_tiep_dan.create({ data: scheduleData });

      await tx.khung_gio_tiep_dan.createMany({
        data: slotRows.map((slot) => ({
          ...slot,
          id_lich_tiep_dan: schedule.id,
        })),
      });

      return tx.lich_tiep_dan.findUnique({
        where: { id: schedule.id },
        include: {
          khung_gio_tiep_dan: {
            where: { is_active: true, is_delete: false },
            orderBy: [{ khung_gio: "asc" }, { ma_quay: "asc" }],
          },
        },
      });
    });
  },

  async countRegistrations(id) {
    return prisma.dang_ky_tiep_dan.count({
      where: { id_lich_tiep_dan: id },
    });
  },

  async updateWithSlots(id, scheduleData, slotRows, replaceSlots) {
    return prisma.$transaction(async (tx) => {
      await tx.lich_tiep_dan.update({
        where: { id },
        data: scheduleData,
      });

      if (replaceSlots) {
        await tx.khung_gio_tiep_dan.deleteMany({
          where: { id_lich_tiep_dan: id },
        });
        await tx.khung_gio_tiep_dan.createMany({
          data: slotRows.map((slot) => ({
            ...slot,
            id_lich_tiep_dan: id,
          })),
        });
      }

      return tx.lich_tiep_dan.findUnique({
        where: { id },
        include: {
          khung_gio_tiep_dan: {
            where: { is_active: true, is_delete: false },
            orderBy: [{ khung_gio: "asc" }, { ma_quay: "asc" }],
          },
        },
      });
    });
  },

  async findDetailById(id) {
    return prisma.lich_tiep_dan.findFirst({
      where: { id },
      include: {
        khung_gio_tiep_dan: {
          where: { is_active: true, is_delete: false },
          orderBy: [{ khung_gio: "asc" }, { ma_quay: "asc" }],
        },
        dang_ky_tiep_dan: {
          select: {
            slot: true,
            bo_phan: true,
          },
        },
      },
    });
  },
};

export default ReceptionScheduleManagementRepository;
