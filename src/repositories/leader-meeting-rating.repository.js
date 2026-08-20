import prisma from "../config/database.config.js";

const LeaderMeetingRatingRepository = {
  async findRegistrationByCode(registrationCode) {
    return prisma.dang_ky_gap_lanh_dao.findFirst({
      where: {
        ma_dang_ky: registrationCode,
        is_active: true,
        is_delete: false,
      },
      select: {
        id: true,
        ma_dang_ky: true,
        trang_thai: true,
        danh_gia_gap_lanh_dao: { select: { id: true } },
      },
    });
  },

  async create(data) {
    return prisma.danh_gia_gap_lanh_dao.create({ data });
  },
};

export default LeaderMeetingRatingRepository;
