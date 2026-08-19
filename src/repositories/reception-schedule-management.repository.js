import prisma from "../config/database.config.js";
import LichTiepDanRepository from "./lich-tiep-dan.repository.js";

const buildCaTiepDanData = (slotRows) => {
  // Extract distinct (khung_gio) from slot rows and build ca_tiep_dan entries
  const seen = new Set();
  return slotRows
    .filter((slot) => {
      if (seen.has(slot.khung_gio)) return false;
      seen.add(slot.khung_gio);
      return true;
    })
    .map((slot) => {
      const [gioBatDau, gioKetThuc] = slot.khung_gio
        .split("-")
        .map((t) => t.trim());
      return {
        gio_bat_dau: `${gioBatDau}:00`,
        gio_ket_thuc: `${gioKetThuc}:00`,
      };
    });
};

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
        // Create ca_tiep_dan entries from distinct slot times (V2)
        const caData = buildCaTiepDanData(record.slotRows);
        const caEntries = [];
        for (const ca of caData) {
          const [caEntry] = await tx.$queryRawUnsafe(
            `INSERT INTO "ca_tiep_dan" ("id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc")
             VALUES ($1, $2, $3)
             ON CONFLICT ("id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc") DO UPDATE SET "gio_bat_dau" = EXCLUDED."gio_bat_dau"
             RETURNING "id"`,
            schedule.id, ca.gio_bat_dau, ca.gio_ket_thuc
          );
          caEntries.push({ gio_bat_dau: ca.gio_bat_dau, gio_ket_thuc: ca.gio_ket_thuc, id: caEntry.id });
        }
        // Create khung_gio_tiep_dan with id_ca_tiep_dan set
        await tx.khung_gio_tiep_dan.createMany({
          data: record.slotRows.map((slot) => {
            const caMatch = caEntries.find((ca) => {
              const [sb, se] = slot.khung_gio.split("-").map((t) => `${t.trim()}:00`);
              return ca.gio_bat_dau === sb && ca.gio_ket_thuc === se;
            });
            return {
              ...slot,
              id_lich_tiep_dan: schedule.id,
              id_ca_tiep_dan: caMatch?.id || null,
            };
          }),
        });
      }
    });
  },

  async createWithSlots(scheduleData, slotRows) {
    return prisma.$transaction(async (tx) => {
      const schedule = await tx.lich_tiep_dan.create({ data: scheduleData });

      // Create ca_tiep_dan entries from distinct slot times (V2)
      const caData = buildCaTiepDanData(slotRows);
      const caEntries = [];
      for (const ca of caData) {
        const [caEntry] = await tx.$queryRawUnsafe(
          `INSERT INTO "ca_tiep_dan" ("id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc")
           VALUES ($1, $2, $3)
           ON CONFLICT ("id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc") DO UPDATE SET "gio_bat_dau" = EXCLUDED."gio_bat_dau"
           RETURNING "id"`,
          schedule.id, ca.gio_bat_dau, ca.gio_ket_thuc
        );
        caEntries.push({ gio_bat_dau: ca.gio_bat_dau, gio_ket_thuc: ca.gio_ket_thuc, id: caEntry.id });
      }

      await tx.khung_gio_tiep_dan.createMany({
        data: slotRows.map((slot) => {
          const caMatch = caEntries.find((ca) => {
            const [sb, se] = slot.khung_gio.split("-").map((t) => `${t.trim()}:00`);
            return ca.gio_bat_dau === sb && ca.gio_ket_thuc === se;
          });
          return {
            ...slot,
            id_lich_tiep_dan: schedule.id,
            id_ca_tiep_dan: caMatch?.id || null,
          };
        }),
      });

      return tx.lich_tiep_dan.findUnique({
        where: { id: schedule.id },
        include: {
          ca_tiep_dan: {
            where: { is_active: true, is_delete: false },
            orderBy: [{ gio_bat_dau: "asc" }],
          },
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

  async updateStatusIfAllowed(id, isActive, updateData) {
    return prisma.$transaction(
      async (tx) => {
        const schedule = await tx.lich_tiep_dan.findFirst({
          where: { id, is_delete: false },
        });
        if (!schedule) return { status: "NOT_FOUND" };

        if (!isActive) {
          const registrationCount = await tx.dang_ky_tiep_dan.count({
            where: { id_lich_tiep_dan: id },
          });
          if (registrationCount > 0) {
            return { status: "HAS_REGISTRATIONS", registrationCount };
          }
        }

        const data = await tx.lich_tiep_dan.update({
          where: { id },
          data: { ...updateData, is_active: isActive },
        });
        return { status: "UPDATED", data };
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

        // Create ca_tiep_dan entries from distinct slot times (V2)
        const caData = buildCaTiepDanData(slotRows);
        const caEntries = [];
        for (const ca of caData) {
          const [caEntry] = await tx.$queryRawUnsafe(
            `INSERT INTO "ca_tiep_dan" ("id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc")
             VALUES ($1, $2, $3)
             ON CONFLICT ("id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc") DO UPDATE SET "gio_bat_dau" = EXCLUDED."gio_bat_dau"
             RETURNING "id"`,
            id, ca.gio_bat_dau, ca.gio_ket_thuc
          );
          caEntries.push({ gio_bat_dau: ca.gio_bat_dau, gio_ket_thuc: ca.gio_ket_thuc, id: caEntry.id });
        }

        await tx.khung_gio_tiep_dan.createMany({
          data: slotRows.map((slot) => {
            const caMatch = caEntries.find((ca) => {
              const [sb, se] = slot.khung_gio.split("-").map((t) => `${t.trim()}:00`);
              return ca.gio_bat_dau === sb && ca.gio_ket_thuc === se;
            });
            return {
              ...slot,
              id_lich_tiep_dan: id,
              id_ca_tiep_dan: caMatch?.id || null,
            };
          }),
        });
      }

      return tx.lich_tiep_dan.findUnique({
        where: { id },
        include: {
          ca_tiep_dan: {
            where: { is_active: true, is_delete: false },
            orderBy: [{ gio_bat_dau: "asc" }],
          },
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
        ca_tiep_dan: {
          where: { is_active: true, is_delete: false },
          orderBy: [{ gio_bat_dau: "asc" }],
        },
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
