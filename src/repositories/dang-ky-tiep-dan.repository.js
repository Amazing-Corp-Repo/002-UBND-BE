import prisma from "../config/database.config.js";
import { DEFAULT_RECEPTION_COUNTER_CAPACITY } from "../constants/reception-schedule.constant.js";

const DangKyTiepDanRepository = {
  async findScheduleById(id) {
    return prisma.lich_tiep_dan.findFirst({
      where: { id, is_active: true, is_delete: false },
      include: {
        khung_gio_tiep_dan: {
          where: { is_active: true, is_delete: false },
        },
      },
    });
  },

  async findDuplicate({ idLichTiepDan, slot, sdt }) {
    return prisma.dang_ky_tiep_dan.findFirst({
      where: {
        id_lich_tiep_dan: idLichTiepDan,
        slot,
        sdt,
        is_active: true,
        is_delete: false,
      },
    });
  },

  async create(data) {
    return prisma.dang_ky_tiep_dan.create({ data });
  },

  async createWithGuards({
    scheduleId,
    slot,
    phoneNumber,
    citizenId,
    totalCapacity,
    data,
  }) {
    return prisma.$transaction(async (tx) => {
      const schedule = await tx.lich_tiep_dan.findFirst({
        where: { id: scheduleId, is_active: true, is_delete: false },
      });
      if (!schedule) return { conflict: "SCHEDULE_UNAVAILABLE" };

      const configuredSlots = await tx.khung_gio_tiep_dan.findMany({
        where: {
          id_lich_tiep_dan: scheduleId,
          is_active: true,
          is_delete: false,
        },
        select: { khung_gio: true, suc_chua: true },
      });
      const matchingSlots = configuredSlots.filter(
        (configuredSlot) => configuredSlot.khung_gio === slot
      );
      if (configuredSlots.length > 0 && matchingSlots.length === 0) {
        return { conflict: "INVALID_SLOT" };
      }
      const effectiveCapacity = matchingSlots.length > 0
        ? matchingSlots.reduce(
            (total, configuredSlot) => total + configuredSlot.suc_chua,
            0
          )
        : totalCapacity;

      const [duplicate, heldCount, phoneDailyCount, citizenDailyCount] =
        await Promise.all([
          tx.dang_ky_tiep_dan.findFirst({
            where: {
              id_lich_tiep_dan: scheduleId,
              slot,
              sdt: phoneNumber,
            },
            select: { id: true },
          }),
          tx.dang_ky_tiep_dan.count({
            where: { id_lich_tiep_dan: scheduleId, slot },
          }),
          tx.dang_ky_tiep_dan.count({
            where: {
              loai: "COUNTER_RECEPTION",
              ngay: schedule.ngay_tiep_dan,
              sdt: phoneNumber,
            },
          }),
          tx.dang_ky_tiep_dan.count({
            where: {
              loai: "COUNTER_RECEPTION",
              ngay: schedule.ngay_tiep_dan,
              cccd: citizenId,
            },
          }),
        ]);

      if (duplicate) return { conflict: "DUPLICATE_SLOT_PHONE" };
      if (phoneDailyCount >= 2) return { conflict: "PHONE_DAILY_LIMIT" };
      if (citizenDailyCount >= 2) return { conflict: "CITIZEN_DAILY_LIMIT" };
      if (heldCount >= effectiveCapacity) return { conflict: "SLOT_FULL" };

      const registration = await tx.dang_ky_tiep_dan.create({
        data: {
          ...data,
          ngay: schedule.ngay_tiep_dan,
        },
      });
      return { registration };
    }, { isolationLevel: "Serializable" });
  },

  async findForCitizenLookup({ receptionCode, phoneNumber }) {
    return prisma.dang_ky_tiep_dan.findMany({
      where: {
        ...(receptionCode ? { ma_tiep_dan: receptionCode } : {}),
        ...(phoneNumber ? { sdt: phoneNumber } : {}),
        is_active: true,
        is_delete: false,
      },
      orderBy: { thoi_gian_tao: "desc" },
      take: 50,
    });
  },

  async findAllForStaff(filters) {
    const skip = (filters.page - 1) * filters.size;
    const where = {
      loai: "COUNTER_RECEPTION",
      is_active: true,
      is_delete: false,
      ...(filters.search
        ? {
            OR: [
              { ma_tiep_dan: { contains: filters.search, mode: "insensitive" } },
              { ho_ten: { contains: filters.search, mode: "insensitive" } },
              { sdt: { contains: filters.search } },
            ],
          }
        : {}),
      ...(filters.receptionDate
        ? {
            ngay: {
              gte: new Date(`${filters.receptionDate}T00:00:00.000Z`),
              lte: new Date(`${filters.receptionDate}T23:59:59.999Z`),
            },
          }
        : {}),
      ...(filters.approvalStatus
        ? { trang_thai: filters.approvalStatus }
        : {}),
      ...(filters.department ? { bo_phan: filters.department } : {}),
      ...(filters.ratingStatus === "RATED"
        ? { danh_gia_tiep_dan: { some: { is_delete: false } } }
        : {}),
      ...(filters.ratingStatus === "NOT_RATED"
        ? { danh_gia_tiep_dan: { none: { is_delete: false } } }
        : {}),
    };

    const [data, totalItems] = await Promise.all([
      prisma.dang_ky_tiep_dan.findMany({
        where,
        include: {
          danh_gia_tiep_dan: {
            where: { is_delete: false },
            select: { id: true },
            take: 1,
          },
        },
        orderBy: [{ ngay: "desc" }, { slot: "asc" }],
        skip,
        take: filters.size,
      }),
      prisma.dang_ky_tiep_dan.count({ where }),
    ]);

    return { data, totalItems };
  },

  async findDetailById(id) {
    return prisma.dang_ky_tiep_dan.findFirst({
      where: {
        id,
        loai: "COUNTER_RECEPTION",
        is_active: true,
        is_delete: false,
      },
      include: {
        lich_tiep_dan: {
          select: {
            id: true,
            ten_can_bo: true,
            dia_diem: true,
            ngay_tiep_dan: true,
            thoi_gian: true,
            ghi_chu: true,
          },
        },
        danh_gia_tiep_dan: {
          where: { is_delete: false },
          select: {
            id: true,
            diem_tong: true,
            ly_do: true,
            nhan_xet: true,
            thoi_gian_tao: true,
          },
          take: 1,
        },
      },
    });
  },

  async findActiveById(id) {
    return prisma.dang_ky_tiep_dan.findFirst({
      where: {
        id,
        loai: "COUNTER_RECEPTION",
        is_active: true,
        is_delete: false,
      },
    });
  },

  async approvePending(id, data) {
    const result = await prisma.dang_ky_tiep_dan.updateMany({
      where: {
        id,
        trang_thai: "PENDING",
        is_active: true,
        is_delete: false,
      },
      data,
    });
    if (result.count === 0) return null;
    return DangKyTiepDanRepository.findDetailById(id);
  },

  async approvePendingWithCounterGuard(id, department, data) {
    const outcome = await prisma.$transaction(async (tx) => {
      const registration = await tx.dang_ky_tiep_dan.findFirst({
        where: {
          id,
          loai: "COUNTER_RECEPTION",
          trang_thai: "PENDING",
          is_active: true,
          is_delete: false,
        },
      });
      if (!registration) return { conflict: "ALREADY_PROCESSED" };

      const counterSlots = await tx.khung_gio_tiep_dan.findMany({
        where: {
          id_lich_tiep_dan: registration.id_lich_tiep_dan,
          khung_gio: registration.slot,
          ma_quay: department,
          is_active: true,
          is_delete: false,
        },
        select: { suc_chua: true },
      });
      const capacity = counterSlots.length > 0
        ? counterSlots.reduce((total, slot) => total + slot.suc_chua, 0)
        : DEFAULT_RECEPTION_COUNTER_CAPACITY;
      const assignedCount = await tx.dang_ky_tiep_dan.count({
        where: {
          id_lich_tiep_dan: registration.id_lich_tiep_dan,
          slot: registration.slot,
          bo_phan: department,
        },
      });
      if (assignedCount >= capacity) return { conflict: "COUNTER_FULL" };

      const updated = await tx.dang_ky_tiep_dan.updateMany({
        where: {
          id,
          trang_thai: "PENDING",
          is_active: true,
          is_delete: false,
        },
        data,
      });
      return updated.count === 1
        ? { approved: true }
        : { conflict: "ALREADY_PROCESSED" };
    }, { isolationLevel: "Serializable" });

    if (!outcome.approved) return outcome;
    return { registration: await DangKyTiepDanRepository.findDetailById(id) };
  },

  async findForRatingByCode(receptionCode) {
    return prisma.dang_ky_tiep_dan.findFirst({
      where: {
        ma_tiep_dan: receptionCode,
        loai: "COUNTER_RECEPTION",
        is_active: true,
        is_delete: false,
      },
      include: {
        danh_gia_tiep_dan: {
          where: { is_delete: false },
          select: { id: true },
          take: 1,
        },
      },
    });
  },
};

export default DangKyTiepDanRepository;
