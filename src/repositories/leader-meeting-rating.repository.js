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

  async findAll({ page, limit, search, score, leaderId, fromDate, toDate }) {
    const registrationWhere = {
      is_active: true,
      is_delete: false,
      khung_gio_gap_lanh_dao: {
        lich_gap_lanh_dao: {
          id_lanh_dao: leaderId || undefined,
          is_delete: false,
        },
      },
    };
    const where = {
      is_active: true,
      is_delete: false,
      diem_tong: score,
      thoi_gian_tao:
        fromDate || toDate
          ? {
              gte: fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : undefined,
              lte: toDate ? new Date(`${toDate}T23:59:59.999Z`) : undefined,
            }
          : undefined,
      ...(search
        ? {
            OR: [
              { nhan_xet: { contains: search, mode: "insensitive" } },
              { dang_ky_gap_lanh_dao: { ma_dang_ky: { contains: search, mode: "insensitive" } } },
              { dang_ky_gap_lanh_dao: { ho_ten: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
      dang_ky_gap_lanh_dao: registrationWhere,
    };
    const [data, totalItems] = await Promise.all([
      prisma.danh_gia_gap_lanh_dao.findMany({
        where,
        orderBy: { thoi_gian_tao: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          diem_tong: true,
          ly_do: true,
          nhan_xet: true,
          thoi_gian_tao: true,
          dang_ky_gap_lanh_dao: {
            select: {
              id: true,
              ma_dang_ky: true,
              ho_ten: true,
              ngay_hen: true,
              chu_de: true,
              khung_gio_gap_lanh_dao: {
                select: {
                  gio_bat_dau: true,
                  gio_ket_thuc: true,
                  lich_gap_lanh_dao: {
                    select: {
                      dia_diem: true,
                      lanh_dao: { select: { id: true, ho_va_ten: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.danh_gia_gap_lanh_dao.count({ where }),
    ]);
    return { data, totalItems };
  },
};

export default LeaderMeetingRatingRepository;
