import prisma from "../config/database.config.js";

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
    }, { isolationLevel: "Serializable" });
  },
};

export default ReceptionCounterAssignmentRepository;
