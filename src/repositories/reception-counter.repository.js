import prisma from "../config/database.config.js";

const ReceptionCounterRepository = {
  async findAllActive() {
    return prisma.quay_tiep_dan.findMany({
      where: { is_active: true, is_delete: false },
      orderBy: [{ so_thu_tu: "asc" }, { ma_quay: "asc" }],
    });
  },

  async findActiveById(id) {
    return prisma.quay_tiep_dan.findFirst({
      where: { id, is_active: true, is_delete: false },
    });
  },
};

export default ReceptionCounterRepository;
