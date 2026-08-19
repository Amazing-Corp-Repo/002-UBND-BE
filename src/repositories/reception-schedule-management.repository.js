import prisma from "../config/database.config.js";
import LichTiepDanRepository from "./lich-tiep-dan.repository.js";

const ReceptionScheduleManagementRepository = {
  ...LichTiepDanRepository,

  async findImportConflicts(records) {
    return prisma.lich_tiep_dan.findMany({
      where: {
        is_delete: false,
        OR: records.map((record) => ({
          ten_can_bo: record.officerName,
          ngay_tiep_dan: record.scheduleData.ngay_tiep_dan,
        })),
      },
      select: { id: true, ten_can_bo: true, ngay_tiep_dan: true },
    });
  },

  async createManyWithSlots(records) {
    return prisma.$transaction(async (tx) => {
      for (const record of records) {
        const schedule = await tx.lich_tiep_dan.create({
          data: record.scheduleData,
        });
        await tx.khung_gio_tiep_dan.createMany({
          data: record.slotRows.map((slot) => ({
            ...slot,
            id_lich_tiep_dan: schedule.id,
          })),
        });
      }
    });
  },

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

  async softDeleteIfNoRegistrations(id, buildUpdateData) {
    return prisma.$transaction(
      async (tx) => {
        const schedule = await tx.lich_tiep_dan.findFirst({
          where: { id, is_delete: false },
        });
        if (!schedule) return { status: "NOT_FOUND" };
        if (schedule.is_active) return { status: "ACTIVE" };

        const registrationCount = await tx.dang_ky_tiep_dan.count({
          where: { id_lich_tiep_dan: id },
        });
        if (registrationCount > 0) {
          return { status: "HAS_REGISTRATIONS", registrationCount };
        }

        const data = await tx.lich_tiep_dan.update({
          where: { id },
          data: buildUpdateData(schedule),
        });
        return { status: "DELETED", data };
      },
      { isolationLevel: "Serializable" }
    );
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
