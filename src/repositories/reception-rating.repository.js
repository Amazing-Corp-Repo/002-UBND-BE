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

  async findAllForLeader(filters) {
    const registrationWhere = {
      loai: "COUNTER_RECEPTION",
      is_active: true,
      is_delete: false,
      ...(filters.department ? { bo_phan: filters.department } : {}),
    };
    const where = {
      is_active: true,
      is_delete: false,
      ...(filters.score ? { diem_tong: filters.score } : {}),
      ...(filters.fromDate || filters.toDate
        ? {
            thoi_gian_tao: {
              ...(filters.fromDate
                ? { gte: new Date(`${filters.fromDate}T00:00:00.000Z`) }
                : {}),
              ...(filters.toDate
                ? { lte: new Date(`${filters.toDate}T23:59:59.999Z`) }
                : {}),
            },
          }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { nhan_xet: { contains: filters.search, mode: "insensitive" } },
              {
                dang_ky_tiep_dan: {
                  ma_tiep_dan: { contains: filters.search, mode: "insensitive" },
                },
              },
              {
                dang_ky_tiep_dan: {
                  ho_ten: { contains: filters.search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
      dang_ky_tiep_dan: registrationWhere,
    };
    const skip = (filters.page - 1) * filters.size;

    const [data, totalItems] = await Promise.all([
      prisma.danh_gia_tiep_dan.findMany({
        where,
        include: {
          dang_ky_tiep_dan: {
            select: {
              ma_tiep_dan: true,
              ho_ten: true,
              bo_phan: true,
              ngay: true,
              slot: true,
              chu_de: true,
            },
          },
        },
        orderBy: { thoi_gian_tao: "desc" },
        skip,
        take: filters.size,
      }),
      prisma.danh_gia_tiep_dan.count({ where }),
    ]);

    return { data, totalItems };
  },

  async findDetailById(id) {
    return prisma.danh_gia_tiep_dan.findFirst({
      where: { id, is_active: true, is_delete: false },
      include: {
        dang_ky_tiep_dan: {
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
          },
        },
      },
    });
  },

  async getStatistics(filters) {
    const createdAtFilter =
      filters.fromDate || filters.toDate
        ? {
            thoi_gian_tao: {
              ...(filters.fromDate
                ? { gte: new Date(`${filters.fromDate}T00:00:00.000Z`) }
                : {}),
              ...(filters.toDate
                ? { lte: new Date(`${filters.toDate}T23:59:59.999Z`) }
                : {}),
            },
          }
        : {};
    const baseWhere = {
      is_active: true,
      is_delete: false,
      ...createdAtFilter,
      dang_ky_tiep_dan: {
        loai: "COUNTER_RECEPTION",
        is_active: true,
        is_delete: false,
        ...(filters.department ? { bo_phan: filters.department } : {}),
      },
    };
    const departments = filters.department
      ? [filters.department]
      : Array.from({ length: 8 }, (_, index) => `QUAY_${index + 1}`);

    const [overall, scoreGroups, ...departmentGroups] = await Promise.all([
      prisma.danh_gia_tiep_dan.aggregate({
        where: baseWhere,
        _count: { _all: true },
        _avg: { diem_tong: true },
      }),
      prisma.danh_gia_tiep_dan.groupBy({
        by: ["diem_tong"],
        where: baseWhere,
        _count: { _all: true },
        orderBy: { diem_tong: "asc" },
      }),
      ...departments.map((department) =>
        prisma.danh_gia_tiep_dan.aggregate({
          where: {
            ...baseWhere,
            dang_ky_tiep_dan: {
              ...baseWhere.dang_ky_tiep_dan,
              bo_phan: department,
            },
          },
          _count: { _all: true },
          _avg: { diem_tong: true },
        })
      ),
    ]);

    return {
      overall,
      scoreGroups,
      departmentGroups: departments.map((department, index) => ({
        department,
        ...departmentGroups[index],
      })),
    };
  },
};

export default ReceptionRatingRepository;
