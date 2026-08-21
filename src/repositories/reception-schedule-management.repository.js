import prisma from "../config/database.config.js";
import LichTiepDanRepository from "./lich-tiep-dan.repository.js";
import { attachReceptionV2Relations } from "../mapper/reception-schedule-v2.mapper.js";

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

const findActiveCounters = (tx) =>
  tx.quay_tiep_dan.findMany({
    where: { is_active: true, is_delete: false },
    select: { id: true, ma_quay: true },
  });

const createCaEntries = async (tx, scheduleId, slotRows) => {
  const caData = buildCaTiepDanData(slotRows);
  const params = [];
  const values = caData.map((ca, index) => {
    const offset = index * 3;
    params.push(scheduleId, ca.gio_bat_dau, ca.gio_ket_thuc);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
  });

  return tx.$queryRawUnsafe(
    `INSERT INTO "ca_tiep_dan" ("id_lich_tiep_dan", "gio_bat_dau", "gio_ket_thuc")
     VALUES ${values.join(", ")}
     RETURNING "id", "gio_bat_dau"::text AS "gio_bat_dau", "gio_ket_thuc"::text AS "gio_ket_thuc"`,
    ...params
  );
};

const buildV2SlotRows = (slotRows, scheduleId, caEntries, counters) => {
  return attachReceptionV2Relations({
    slotRows,
    scheduleId,
    shiftEntries: caEntries,
    counters,
  });
};

const createImportRecords = async (tx, records) => {
  const counters = await findActiveCounters(tx);
  for (const record of records) {
    const schedule = await tx.lich_tiep_dan.create({
      data: record.scheduleData,
    });
    const caEntries = await createCaEntries(tx, schedule.id, record.slotRows);
    const slotRows = buildV2SlotRows(
      record.slotRows,
      schedule.id,
      caEntries,
      counters
    );
    await tx.khung_gio_tiep_dan.createMany({ data: slotRows });

    const configurations = await tx.khung_gio_tiep_dan.findMany({
      where: { id_lich_tiep_dan: schedule.id },
      select: { id: true, khung_gio: true, ma_quay: true },
    });
    const configurationMap = new Map(
      configurations.map((configuration) => [
        `${configuration.khung_gio}::${configuration.ma_quay}`,
        configuration.id,
      ])
    );
    const assignmentData = record.assignmentRows.map((assignment) => {
      const configurationId = configurationMap.get(
        `${assignment.khung_gio}::${assignment.ma_quay}`
      );
      if (!configurationId) {
        throw new Error(
          `Không tìm thấy cấu hình quầy ${assignment.ma_quay} trong ca ${assignment.khung_gio}`
        );
      }
      return {
        id_cau_hinh_quay: configurationId,
        id_can_bo: assignment.officerId,
        nguoi_tao: record.scheduleData.nguoi_tao,
        nguoi_cap_nhat: record.scheduleData.nguoi_tao,
      };
    });
    await tx.phan_cong_quay_tiep_dan.createMany({ data: assignmentData });
  }
};

const ReceptionScheduleManagementRepository = {
  ...LichTiepDanRepository,

  async findActiveCountersByCodes(counterCodes) {
    if (!counterCodes.length) return [];
    return prisma.quay_tiep_dan.findMany({
      where: {
        ma_quay: { in: counterCodes },
        is_active: true,
        is_delete: false,
      },
      select: {
        id: true,
        ma_quay: true,
        ten_quay: true,
        suc_chua_mac_dinh: true,
      },
    });
  },

  async findImportConflicts(records) {
    return prisma.lich_tiep_dan.findMany({
      where: {
        is_delete: false,
        OR: records.map((record) => ({
          dia_diem: record.location,
          ngay_tiep_dan: record.scheduleData.ngay_tiep_dan,
        })),
      },
      select: { id: true, dia_diem: true, ngay_tiep_dan: true },
    });
  },

  async createManyWithSlots(records) {
    return prisma.$transaction(async (tx) => {
      await createImportRecords(tx, records);
    }, { maxWait: 10_000, timeout: 60_000 });
  },

  async overwriteManyWithSlots(records) {
    return prisma.$transaction(async (tx) => {
      const existingSchedules = await tx.lich_tiep_dan.findMany({
        where: {
          is_delete: false,
          OR: records.map((record) => ({
            dia_diem: record.location,
            ngay_tiep_dan: record.scheduleData.ngay_tiep_dan,
          })),
        },
        select: { id: true },
      });
      const scheduleIds = existingSchedules.map(({ id }) => id);

      if (scheduleIds.length > 0) {
        const registrationCount = await tx.dang_ky_tiep_dan.count({
          where: { id_lich_tiep_dan: { in: scheduleIds } },
        });
        if (registrationCount > 0) {
          return { status: "HAS_REGISTRATIONS", registrationCount };
        }

        const configurations = await tx.khung_gio_tiep_dan.findMany({
          where: { id_lich_tiep_dan: { in: scheduleIds } },
          select: { id: true },
        });
        const configurationIds = configurations.map(({ id }) => id);
        if (configurationIds.length > 0) {
          await tx.phan_cong_quay_tiep_dan.deleteMany({
            where: { id_cau_hinh_quay: { in: configurationIds } },
          });
        }
        await tx.khung_gio_tiep_dan.deleteMany({
          where: { id_lich_tiep_dan: { in: scheduleIds } },
        });
        await tx.ca_tiep_dan.deleteMany({
          where: { id_lich_tiep_dan: { in: scheduleIds } },
        });
        await tx.lich_tiep_dan.deleteMany({
          where: { id: { in: scheduleIds } },
        });
      }

      await createImportRecords(tx, records);
      return {
        status: scheduleIds.length > 0 ? "OVERWRITTEN" : "CREATED",
        overwrittenCount: scheduleIds.length,
      };
    }, { maxWait: 10_000, timeout: 60_000 });
  },

  async createWithSlots(scheduleData, slotRows) {
    return prisma.$transaction(async (tx) => {
      const schedule = await tx.lich_tiep_dan.create({ data: scheduleData });

      const caEntries = await createCaEntries(tx, schedule.id, slotRows);
      const counters = await findActiveCounters(tx);

      await tx.khung_gio_tiep_dan.createMany({
        data: buildV2SlotRows(slotRows, schedule.id, caEntries, counters),
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
        await tx.ca_tiep_dan.deleteMany({
          where: { id_lich_tiep_dan: id },
        });

        const caEntries = await createCaEntries(tx, id, slotRows);
        const counters = await findActiveCounters(tx);

        await tx.khung_gio_tiep_dan.createMany({
          data: buildV2SlotRows(slotRows, id, caEntries, counters),
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
          include: {
            quay_tiep_dan: {
              select: { id: true, ma_quay: true, ten_quay: true },
            },
          },
        },
        dang_ky_tiep_dan: {
          where: { loai: "COUNTER_RECEPTION" },
          select: {
            slot: true,
            bo_phan: true,
            id_cau_hinh_quay: true,
          },
        },
      },
    });
  },
};

export default ReceptionScheduleManagementRepository;
