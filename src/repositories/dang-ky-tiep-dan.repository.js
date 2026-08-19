import prisma from "../config/database.config.js";
import {
  buildReceptionDepartmentFilter,
  receptionCounterRelation,
} from "../mapper/reception-registration-v2.mapper.js";

const DangKyTiepDanRepository = {
  async findScheduleById(id) {
    return prisma.lich_tiep_dan.findFirst({
      where: { id, is_active: true, is_delete: false },
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
  },

  async findDuplicate({ idLichTiepDan, idCaTiepDan, slot, sdt }) {
    return prisma.dang_ky_tiep_dan.findFirst({
      where: {
        ...(idCaTiepDan
          ? { id_ca_tiep_dan: idCaTiepDan }
          : { id_lich_tiep_dan: idLichTiepDan, slot }),
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
    slotId,
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
        select: { id: true, khung_gio: true, suc_chua: true, id_ca_tiep_dan: true },
      });
      const selectedSlot = slotId
        ? configuredSlots.find((configuredSlot) => configuredSlot.id === slotId)
        : null;
      if (slotId && !selectedSlot) {
        return { conflict: "SLOT_NOT_FOUND" };
      }
      if (selectedSlot && slot && selectedSlot.khung_gio !== slot) {
        return { conflict: "INVALID_SLOT" };
      }
      const resolvedSlot = selectedSlot?.khung_gio || slot;
      const matchingSlots = configuredSlots.filter(
        (configuredSlot) => configuredSlot.khung_gio === resolvedSlot
      );
      if (
        !resolvedSlot ||
        (configuredSlots.length > 0 && matchingSlots.length === 0)
      ) {
        return { conflict: "INVALID_SLOT" };
      }
      const effectiveCapacity = matchingSlots.length > 0
        ? matchingSlots.reduce(
            (total, configuredSlot) => total + configuredSlot.suc_chua,
            0
          )
        : totalCapacity;

      // Resolve ca_tiep_dan from the first matching slot (V2)
      const caTiepDanId = matchingSlots[0]?.id_ca_tiep_dan || null;

      const [
        duplicatePhone,
        duplicateCitizen,
        heldCount,
        phoneDailyCount,
        citizenDailyCount,
      ] =
        await Promise.all([
          caTiepDanId
            ? tx.dang_ky_tiep_dan.findFirst({
                where: {
                  loai: "COUNTER_RECEPTION",
                  id_ca_tiep_dan: caTiepDanId,
                  sdt: phoneNumber,
                },
                select: { id: true },
              })
            : tx.dang_ky_tiep_dan.findFirst({
                where: {
                  loai: "COUNTER_RECEPTION",
                  id_lich_tiep_dan: scheduleId,
                  slot: resolvedSlot,
                  sdt: phoneNumber,
                },
                select: { id: true },
              }),
          caTiepDanId
            ? tx.dang_ky_tiep_dan.findFirst({
                where: {
                  loai: "COUNTER_RECEPTION",
                  id_ca_tiep_dan: caTiepDanId,
                  cccd: citizenId,
                },
                select: { id: true },
              })
            : tx.dang_ky_tiep_dan.findFirst({
                where: {
                  loai: "COUNTER_RECEPTION",
                  id_lich_tiep_dan: scheduleId,
                  slot: resolvedSlot,
                  cccd: citizenId,
                },
                select: { id: true },
              }),
          caTiepDanId
            ? tx.dang_ky_tiep_dan.count({
                where: { id_ca_tiep_dan: caTiepDanId },
              })
            : tx.dang_ky_tiep_dan.count({
                where: { id_lich_tiep_dan: scheduleId, slot: resolvedSlot },
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

      if (duplicatePhone) return { conflict: "DUPLICATE_SLOT_PHONE" };
      if (duplicateCitizen) return { conflict: "DUPLICATE_SLOT_CITIZEN" };
      if (phoneDailyCount >= 2) return { conflict: "PHONE_DAILY_LIMIT" };
      if (citizenDailyCount >= 2) return { conflict: "CITIZEN_DAILY_LIMIT" };
      if (heldCount >= effectiveCapacity) return { conflict: "SLOT_FULL" };

      const registration = await tx.dang_ky_tiep_dan.create({
        data: {
          ...data,
          ngay: schedule.ngay_tiep_dan,
          slot: resolvedSlot,
          id_ca_tiep_dan: caTiepDanId,
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
      include: { cau_hinh_quay: receptionCounterRelation },
      orderBy: { thoi_gian_tao: "desc" },
      take: 50,
    });
  },

  async findAllForStaff(filters) {
    const skip = (filters.page - 1) * filters.size;
    const andFilters = [];
    if (filters.search) {
      andFilters.push({
        OR: [
          { ma_tiep_dan: { contains: filters.search, mode: "insensitive" } },
          { ho_ten: { contains: filters.search, mode: "insensitive" } },
          { sdt: { contains: filters.search } },
        ],
      });
    }
    const departmentFilter = buildReceptionDepartmentFilter(filters.department);
    if (departmentFilter) andFilters.push(departmentFilter);

    const where = {
      loai: "COUNTER_RECEPTION",
      is_active: true,
      is_delete: false,
      ...(andFilters.length > 0 ? { AND: andFilters } : {}),
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
          cau_hinh_quay: receptionCounterRelation,
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
        ca_tiep_dan: {
          select: {
            id: true,
            gio_bat_dau: true,
            gio_ket_thuc: true,
          },
        },
        cau_hinh_quay: {
          select: {
            id: true,
            ma_quay: true,
            khung_gio: true,
            suc_chua: true,
            id_ca_tiep_dan: true,
            quay_tiep_dan: receptionCounterRelation.select.quay_tiep_dan,
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
      include: { cau_hinh_quay: receptionCounterRelation },
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

  async approvePendingWithCounterGuard(id, department, currentUserId, data) {
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

      const assignment = await tx.phan_cong_quay_tiep_dan.findFirst({
        where: {
          id_can_bo: currentUserId,
          is_active: true,
          is_delete: false,
          cau_hinh_quay: {
            ...(registration.id_ca_tiep_dan
              ? { id_ca_tiep_dan: registration.id_ca_tiep_dan }
              : {
                  id_lich_tiep_dan: registration.id_lich_tiep_dan,
                  khung_gio: registration.slot,
                }),
            is_active: true,
            is_delete: false,
          },
        },
        include: {
          cau_hinh_quay: {
            include: {
              quay_tiep_dan: {
                select: { id: true, ma_quay: true, ten_quay: true },
              },
            },
          },
        },
      });
      if (!assignment) return { conflict: "ASSIGNMENT_NOT_FOUND" };

      const counterConfiguration = assignment.cau_hinh_quay;
      const assignedDepartment =
        counterConfiguration.quay_tiep_dan?.ma_quay || counterConfiguration.ma_quay;
      if (department && department !== assignedDepartment) {
        return { conflict: "ASSIGNMENT_MISMATCH" };
      }

      const assignedCount = await tx.dang_ky_tiep_dan.count({
        where: {
          id_cau_hinh_quay: assignment.id_cau_hinh_quay,
          is_delete: false,
        },
      });
      if (assignedCount >= counterConfiguration.suc_chua) {
        return { conflict: "COUNTER_FULL" };
      }

      const updateData = {
        ...data,
        bo_phan: assignedDepartment,
        id_cau_hinh_quay: assignment.id_cau_hinh_quay,
        ...(!registration.id_ca_tiep_dan && counterConfiguration.id_ca_tiep_dan
          ? { id_ca_tiep_dan: counterConfiguration.id_ca_tiep_dan }
          : {}),
      };

      const updated = await tx.dang_ky_tiep_dan.updateMany({
        where: {
          id,
          trang_thai: "PENDING",
          is_active: true,
          is_delete: false,
        },
        data: updateData,
      });
      return updated.count === 1
        ? { approved: true }
        : { conflict: "ALREADY_PROCESSED" };
    }, { isolationLevel: "Serializable" });

    if (!outcome.approved) return outcome;
    return { registration: await DangKyTiepDanRepository.findDetailById(id) };
  },

  async completeApproved(id, data) {
    const result = await prisma.dang_ky_tiep_dan.updateMany({
      where: {
        id,
        loai: "COUNTER_RECEPTION",
        trang_thai: "APPROVED",
        is_active: true,
        is_delete: false,
      },
      data,
    });
    if (result.count === 0) return null;
    return DangKyTiepDanRepository.findDetailById(id);
  },

  async rejectPending(id, data) {
    const result = await prisma.dang_ky_tiep_dan.updateMany({
      where: {
        id,
        loai: "COUNTER_RECEPTION",
        trang_thai: "PENDING",
        is_active: true,
        is_delete: false,
      },
      data,
    });
    if (result.count === 0) return null;
    return DangKyTiepDanRepository.findDetailById(id);
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
        cau_hinh_quay: receptionCounterRelation,
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
