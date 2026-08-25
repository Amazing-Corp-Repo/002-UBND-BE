import prisma from "../config/database.config.js";

export const RECEPTION_ASSIGNMENT_TRANSACTION_OPTIONS = Object.freeze({
  isolationLevel: "Serializable",
  maxWait: 10000,
  timeout: 120000,
});

const assignmentInclude = {
  can_bo: { select: { id: true, ho_va_ten: true, ten_dang_nhap: true } },
  cau_hinh_quay: {
    include: {
      quay_tiep_dan: { select: { id: true, ma_quay: true, ten_quay: true } },
      ca_tiep_dan: {
        include: {
          lich_tiep_dan: { select: { id: true, ngay_tiep_dan: true } },
        },
      },
    },
  },
};

const ReceptionCounterAssignmentRepository = {
  async findAll(filters) {
    return prisma.phan_cong_quay_tiep_dan.findMany({
      where: {
        is_delete: false,
        ...(filters.isActive !== undefined ? { is_active: filters.isActive } : {}),
        ...(filters.officerId ? { id_can_bo: filters.officerId } : {}),
        cau_hinh_quay: {
          ...(filters.shiftId ? { id_ca_tiep_dan: filters.shiftId } : {}),
          ...(filters.counterId ? { id_quay: filters.counterId } : {}),
        },
      },
      include: assignmentInclude,
      orderBy: [{ thoi_gian_tao: "desc" }],
    });
  },

  async findById(id) {
    return prisma.phan_cong_quay_tiep_dan.findFirst({
      where: { id, is_delete: false },
      include: assignmentInclude,
    });
  },

  async findActiveShiftById(id) {
    return prisma.ca_tiep_dan.findFirst({
      where: { id, is_active: true, is_delete: false },
      select: { id: true },
    });
  },

  async findActiveConfigurationsByIds(shiftId, ids) {
    if (ids.length === 0) return [];
    return prisma.khung_gio_tiep_dan.findMany({
      where: {
        id: { in: ids },
        id_ca_tiep_dan: shiftId,
        is_active: true,
        is_delete: false,
        quay_tiep_dan: { is_active: true, is_delete: false },
      },
      select: { id: true },
    });
  },

  async findActiveOfficersByIds(ids) {
    if (ids.length === 0) return [];
    return prisma.nguoi_dung.findMany({
      where: { id: { in: ids }, is_active: true, is_delete: false },
      select: { id: true },
    });
  },

  async replaceForShift(shiftId, assignments, currentUserId) {
    return prisma.$transaction(async (tx) => {
      const configurations = await tx.khung_gio_tiep_dan.findMany({
        where: { id_ca_tiep_dan: shiftId },
        select: { id: true },
      });
      const configurationIds = configurations.map((item) => item.id);
      if (configurationIds.length > 0) {
        await tx.phan_cong_quay_tiep_dan.updateMany({
          where: {
            id_cau_hinh_quay: { in: configurationIds },
            is_active: true,
            is_delete: false,
          },
          data: {
            is_active: false,
            nguoi_cap_nhat: currentUserId,
            thoi_gian_cap_nhat: new Date().toISOString(),
          },
        });
      }

      const created = [];
      for (const assignment of assignments) {
        created.push(await tx.phan_cong_quay_tiep_dan.create({
          data: {
            id_cau_hinh_quay: assignment.counterConfigurationId,
            id_can_bo: assignment.officerId,
            nguoi_tao: currentUserId,
            nguoi_cap_nhat: currentUserId,
          },
          include: assignmentInclude,
        }));
      }
      return created;
    }, RECEPTION_ASSIGNMENT_TRANSACTION_OPTIONS);
  },

  async updateWithGuards(id, input, currentUserId) {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.phan_cong_quay_tiep_dan.findFirst({
        where: { id, is_delete: false },
        include: {
          cau_hinh_quay: { select: { id_ca_tiep_dan: true } },
        },
      });
      if (!assignment) return { conflict: "NOT_FOUND" };

      const officerId = input.officerId || assignment.id_can_bo;
      if (input.officerId) {
        const officer = await tx.nguoi_dung.findFirst({
          where: { id: input.officerId, is_active: true, is_delete: false },
          select: { id: true },
        });
        if (!officer) return { conflict: "OFFICER_NOT_FOUND" };
      }

      const isActive = input.isActive ?? assignment.is_active;
      if (isActive) {
        const activeAssignments = await tx.phan_cong_quay_tiep_dan.findMany({
          where: {
            id: { not: id },
            is_active: true,
            is_delete: false,
            OR: [
              { id_cau_hinh_quay: assignment.id_cau_hinh_quay },
              {
                id_can_bo: officerId,
                cau_hinh_quay: {
                  id_ca_tiep_dan: assignment.cau_hinh_quay.id_ca_tiep_dan,
                },
              },
            ],
          },
          select: { id_cau_hinh_quay: true, id_can_bo: true },
        });
        if (activeAssignments.some(
          (item) => item.id_cau_hinh_quay === assignment.id_cau_hinh_quay
        )) {
          return { conflict: "COUNTER_ALREADY_ASSIGNED" };
        }
        if (activeAssignments.some((item) => item.id_can_bo === officerId)) {
          return { conflict: "OFFICER_ALREADY_ASSIGNED" };
        }
      }

      const updated = await tx.phan_cong_quay_tiep_dan.update({
        where: { id },
        data: {
          ...(input.officerId ? { id_can_bo: input.officerId } : {}),
          ...(input.isActive !== undefined ? { is_active: input.isActive } : {}),
          nguoi_cap_nhat: currentUserId,
          thoi_gian_cap_nhat: new Date().toISOString(),
        },
        include: assignmentInclude,
      });
      return { assignment: updated };
    }, RECEPTION_ASSIGNMENT_TRANSACTION_OPTIONS);
  },

  async softDelete(id, currentUserId) {
    const result = await prisma.phan_cong_quay_tiep_dan.updateMany({
      where: { id, is_delete: false },
      data: {
        is_active: false,
        is_delete: true,
        nguoi_cap_nhat: currentUserId,
        thoi_gian_cap_nhat: new Date().toISOString(),
      },
    });
    return result.count === 1;
  },
};

export default ReceptionCounterAssignmentRepository;
