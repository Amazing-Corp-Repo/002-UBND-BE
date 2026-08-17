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

  async findForCitizenLookup({ receptionCode, phoneNumber }) {
    return prisma.dang_ky_tiep_dan.findMany({
      where: {
        ...(receptionCode ? { ma_tiep_dan: receptionCode } : {}),
        ...(phoneNumber ? { sdt: phoneNumber } : {}),
        is_active: true,
        is_delete: false,
      },
      orderBy: { thoi_gian_tao: "desc" },
      take: 50,
    });
  },

  async findAllForStaff(filters) {
    const skip = (filters.page - 1) * filters.size;
    const where = {
      loai: "COUNTER_RECEPTION",
      is_active: true,
      is_delete: false,
      ...(filters.search
        ? {
            OR: [
              { ma_tiep_dan: { contains: filters.search, mode: "insensitive" } },
              { ho_ten: { contains: filters.search, mode: "insensitive" } },
              { sdt: { contains: filters.search } },
            ],
          }
        : {}),
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
      ...(filters.department ? { bo_phan: filters.department } : {}),
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

  async findForRatingByCode(receptionCode) {
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
};

export default DangKyTiepDanRepository;
