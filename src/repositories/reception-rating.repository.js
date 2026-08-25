import prisma from "../config/database.config.js";
import { RECEPTION_RATING_COUNTER_CODES } from "../constants/reception-rating.constant.js";
import { getVietnamDayUtcRange } from "../utils/vietnam-time.util.js";

const legacyRegistrationInclude = {
  include: {
    cau_hinh_quay: { include: { quay_tiep_dan: true } },
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
};

const buildBaseWhere = (filters) => ({
  is_active: true,
  is_delete: false,
  ...(filters.score ? { diem_tong: filters.score } : {}),
  ...(filters.department ? { ma_quay: filters.department } : {}),
  ...(filters.fromDate || filters.toDate
    ? { thoi_gian_tao: getVietnamDayUtcRange(filters) }
    : {}),
  ...(filters.search
    ? {
        OR: [
          { ma_tiep_dan: { contains: filters.search, mode: "insensitive" } },
          { ten_nguoi_dan: { contains: filters.search, mode: "insensitive" } },
          { ten_can_bo: { contains: filters.search, mode: "insensitive" } },
          {
            noi_dung_lam_viec: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
          { nhan_xet: { contains: filters.search, mode: "insensitive" } },
        ],
      }
    : {}),
});

const ReceptionRatingRepository = {
  async findByReceptionCode(receptionCode) {
    return prisma.danh_gia_tiep_dan.findFirst({
      where: {
        ma_tiep_dan: receptionCode,
        is_active: true,
        is_delete: false,
      },
      select: { id: true },
    });
  },

  async create(data) {
    return prisma.danh_gia_tiep_dan.create({ data });
  },

  async findAllForLeader(filters) {
    const where = buildBaseWhere(filters);
    const skip = (filters.page - 1) * filters.size;
    const [data, totalItems] = await Promise.all([
      prisma.danh_gia_tiep_dan.findMany({
        where,
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
      include: { dang_ky_tiep_dan: legacyRegistrationInclude },
    });
  },

  async getStatistics(filters) {
    const baseWhere = buildBaseWhere(filters);
    const counters = filters.department
      ? [filters.department]
      : RECEPTION_RATING_COUNTER_CODES;
    const [overall, scoreGroups, officerGroups, ...counterGroups] =
      await Promise.all([
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
        prisma.danh_gia_tiep_dan.groupBy({
          by: ["ten_can_bo"],
          where: baseWhere,
          _count: { _all: true },
          _avg: { diem_tong: true },
          orderBy: { ten_can_bo: "asc" },
        }),
        ...counters.map((counterCode) =>
          prisma.danh_gia_tiep_dan.aggregate({
            where: { ...baseWhere, ma_quay: counterCode },
            _count: { _all: true },
            _avg: { diem_tong: true },
          })
        ),
      ]);

    return {
      overall,
      scoreGroups,
      officerGroups,
      counterGroups: counters.map((counterCode, index) => ({
        counterCode,
        ...counterGroups[index],
      })),
    };
  },
};

export default ReceptionRatingRepository;
