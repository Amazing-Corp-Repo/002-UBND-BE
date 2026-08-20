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

  async getStatistics({ leaderId, fromDate, toDate }) {
    const where = {
      is_active: true,
      is_delete: false,
      thoi_gian_tao:
        fromDate || toDate
          ? {
              gte: fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : undefined,
              lte: toDate ? new Date(`${toDate}T23:59:59.999Z`) : undefined,
            }
          : undefined,
      dang_ky_gap_lanh_dao: {
        is_active: true,
        is_delete: false,
        khung_gio_gap_lanh_dao: {
          lich_gap_lanh_dao: {
            id_lanh_dao: leaderId || undefined,
            is_delete: false,
          },
        },
      },
    };
    const queryConditions = [
      'rating."is_active" = TRUE',
      'rating."is_delete" = FALSE',
      'registration."is_active" = TRUE',
      'registration."is_delete" = FALSE',
      'schedule."is_delete" = FALSE',
    ];
    const queryParameters = [];
    const addParameter = (condition, value) => {
      queryParameters.push(value);
      queryConditions.push(`${condition} $${queryParameters.length}`);
    };
    if (fromDate) {
      addParameter('rating."thoi_gian_tao" >=', new Date(`${fromDate}T00:00:00.000Z`));
    }
    if (toDate) {
      addParameter('rating."thoi_gian_tao" <=', new Date(`${toDate}T23:59:59.999Z`));
    }
    if (leaderId) addParameter('schedule."id_lanh_dao" =', leaderId);

    const leaderStatisticsQuery = `
      SELECT
        leader."id" AS "leaderId",
        leader."ho_va_ten" AS "leaderName",
        COUNT(*)::bigint AS "totalRatings",
        AVG(rating."diem_tong")::float8 AS "averageScore"
      FROM "danh_gia_gap_lanh_dao" rating
      JOIN "dang_ky_gap_lanh_dao" registration
        ON registration."id" = rating."id_dang_ky_gap_lanh_dao"
      JOIN "khung_gio_gap_lanh_dao" slot
        ON slot."id" = registration."id_khung_gio_gap"
      JOIN "lich_gap_lanh_dao" schedule
        ON schedule."id" = slot."id_lich_gap"
      JOIN "nguoi_dung" leader
        ON leader."id" = schedule."id_lanh_dao"
      WHERE ${queryConditions.join(" AND ")}
      GROUP BY leader."id", leader."ho_va_ten"
      ORDER BY COUNT(*) DESC, leader."ho_va_ten" ASC
    `;

    const [overall, scoreGroups, rawLeaderGroups] = await Promise.all([
      prisma.danh_gia_gap_lanh_dao.aggregate({
        where,
        _count: { _all: true },
        _avg: { diem_tong: true },
      }),
      prisma.danh_gia_gap_lanh_dao.groupBy({
        by: ["diem_tong"],
        where,
        _count: { _all: true },
        orderBy: { diem_tong: "asc" },
      }),
      prisma.$queryRawUnsafe(leaderStatisticsQuery, ...queryParameters),
    ]);
    const leaderGroups = rawLeaderGroups.map((group) => ({
      leaderId: group.leaderId,
      leaderName: group.leaderName,
      totalRatings: Number(group.totalRatings),
      averageScore: Number(group.averageScore ?? 0),
    }));
    return { overall, scoreGroups, leaderGroups };
  },

  async findDetail(id, leaderId) {
    return prisma.danh_gia_gap_lanh_dao.findFirst({
      where: {
        id,
        is_active: true,
        is_delete: false,
        dang_ky_gap_lanh_dao: {
          is_active: true,
          is_delete: false,
          khung_gio_gap_lanh_dao: {
            lich_gap_lanh_dao: {
              id_lanh_dao: leaderId || undefined,
              is_delete: false,
            },
          },
        },
      },
      select: {
        id: true,
        diem_tong: true,
        tieu_chi: true,
        ly_do: true,
        nhan_xet: true,
        thoi_gian_tao: true,
        dang_ky_gap_lanh_dao: {
          select: {
            id: true,
            ma_dang_ky: true,
            ngay_hen: true,
            ngay_lam_don: true,
            chu_de: true,
            ly_do: true,
            ho_ten: true,
            sdt: true,
            cccd: true,
            dia_chi: true,
            trang_thai: true,
            thoi_gian_hoan_thanh: true,
            khung_gio_gap_lanh_dao: {
              select: {
                id: true,
                gio_bat_dau: true,
                gio_ket_thuc: true,
                lich_gap_lanh_dao: {
                  select: {
                    id: true,
                    dia_diem: true,
                    lanh_dao: {
                      select: { id: true, ho_va_ten: true, email: true, so_dien_thoai: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  },
};

export default LeaderMeetingRatingRepository;
