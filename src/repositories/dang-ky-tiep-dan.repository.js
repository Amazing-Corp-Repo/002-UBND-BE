import prisma from "../config/database.config.js";

const DangKyTiepDanRepository = {
  async findScheduleById(id) {
    return prisma.lich_tiep_dan.findFirst({
      where: { id, is_active: true, is_delete: false },
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
};

export default DangKyTiepDanRepository;
