import prisma from "../config/database.config.js";

const buildBaseWhere = () => ({
  NOT: { is_removed: true },
});

const buildKeywordCondition = (keyword) => ({
  OR: [
    { ten_thu_tuc: { contains: keyword, mode: "insensitive" } },
    { ma_thu_tuc: { contains: keyword, mode: "insensitive" } },
    { ten_loai_thu_tuc: { contains: keyword, mode: "insensitive" } },
    { yeu_cau_dieu_kien_chung: { contains: keyword, mode: "insensitive" } },
  ],
});

const buildLinhVucCondition = (linhVucId) => ({
  thu_tuc_hanh_chinh_linh_vuc: {
    some: {
      id_linh_vuc: linhVucId,
    },
  },
});

const ThuTucRepository = {
  async getAllThuTuc() {
    return prisma.thu_tuc_hanh_chinh.findMany({
      where: buildBaseWhere(),
      orderBy: { ten_thu_tuc: "asc" },
    });
  },

  async searchThuTuc({ keyword, linhVucId } = {}) {
    const where = buildBaseWhere();
    const andConditions = [];

    if (keyword) {
      andConditions.push(buildKeywordCondition(keyword));
    }

    if (linhVucId) {
      andConditions.push(buildLinhVucCondition(linhVucId));
    }

    if (andConditions.length) {
      where.AND = andConditions;
    }

    return prisma.thu_tuc_hanh_chinh.findMany({
      where,
      orderBy: { ten_thu_tuc: "asc" },
    });
  },
};

export default ThuTucRepository;
