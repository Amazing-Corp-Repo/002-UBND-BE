import prisma from "../config/database.config.js";

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
      include: {
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
      },
      orderBy: [{ thoi_gian_tao: "desc" }],
    });
  },
};

export default ReceptionCounterAssignmentRepository;
