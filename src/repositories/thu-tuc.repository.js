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
  
  async findById(thuTucId) {
        return await prisma.thu_tuc_hanh_chinh.findUnique({
            where: { id: thuTucId },
            include: {
                thu_tuc_hanh_chinh_mau_don: {
                    include: {
                        mau_don: true
                    }
                }
            }
        });
    },
  
  async getMauDonByThuTucId(thuTucId) {
        const thuTuc = await prisma.thu_tuc_hanh_chinh.findUnique({
            where: { id: thuTucId },
            include: {
                thu_tuc_hanh_chinh_mau_don: {
                    where: {
                        mau_don: {
                            is_removed: false
                        }
                    },
                    include: {
                        mau_don: true
                    },
                    orderBy: {
                        mau_don: {
                            ten_mau_don: 'asc'
                        }
                    }
                }
            }
        });

        return thuTuc?.thu_tuc_hanh_chinh_mau_don || [];
    },
  
  async exists(thuTucId) {
        const count = await prisma.thu_tuc_hanh_chinh.count({
            where: {
                id: thuTucId,
                is_removed: false
            }
        });
        return count > 0;
    },
};

export default ThuTucRepository;
