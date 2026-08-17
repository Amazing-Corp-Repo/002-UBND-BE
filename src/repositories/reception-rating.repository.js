import prisma from "../config/database.config.js";

const ReceptionRatingRepository = {
  async findRegistrationByCode(receptionCode) {
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

  async create(data) {
    return prisma.danh_gia_tiep_dan.create({ data });
  },
};

export default ReceptionRatingRepository;
