import prisma from "../config/database.config.js";
import { toUTCFromVN_End, toUTCFromVN_Start } from "../utils/string.util.js";

const getDateFilter = (fromDate, toDate) =>
  fromDate || toDate
    ? {
        gte: fromDate ? new Date(toUTCFromVN_Start(fromDate)) : undefined,
        lte: toDate ? new Date(toUTCFromVN_End(toDate)) : undefined,
      }
    : undefined;

const getComplaintScope = (scopedLinhVucIds, selectedLinhVuc) => {
  if (selectedLinhVuc) return { id_linh_vuc_phan_anh: selectedLinhVuc };
  if (scopedLinhVucIds === undefined) return {};
  return { id_linh_vuc_phan_anh: { in: scopedLinhVucIds } };
};

const getRatingWhere = ({ search, score, fromDate, toDate, scopedLinhVucIds, idLinhVucPhanAnh }) => ({
  is_active: true,
  is_delete: false,
  diem: score,
  thoi_gian_tao: getDateFilter(fromDate, toDate),
  ...(search
    ? {
        OR: [
          { nhan_xet: { contains: search, mode: "insensitive" } },
          { phan_anh: { ma_phan_anh: { contains: search, mode: "insensitive" } } },
          { phan_anh: { tieu_de: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {}),
  phan_anh: getComplaintScope(scopedLinhVucIds, idLinhVucPhanAnh),
});

const ratingSelect = {
  id: true,
  diem: true,
  nhan_xet: true,
  thoi_gian_tao: true,
  phan_anh: {
    select: {
      id: true,
      ma_phan_anh: true,
      tieu_de: true,
      id_linh_vuc_phan_anh: true,
      linh_vuc_phan_anh: { select: { id: true, ten: true } },
    },
  },
};

const PhanAnhRatingRepository = {
  async findComplaintByCode(complaintCode) {
    return prisma.phan_anh.findFirst({
      where: { ma_phan_anh: complaintCode },
      select: {
        id: true,
        ma_phan_anh: true,
        lich_su_trang_thai: {
          orderBy: { thoi_gian_tao: "desc" },
          take: 1,
          select: { ten: true, thoi_gian_tao: true },
        },
        danh_gia_phan_anh: { select: { id: true } },
      },
    });
  },

  async findRatingStatusByComplaintCode(complaintCode) {
    return prisma.phan_anh.findFirst({
      where: { ma_phan_anh: complaintCode },
      select: {
        id: true,
        ma_phan_anh: true,
        tieu_de: true,
        linh_vuc_phan_anh: { select: { id: true, ten: true } },
        lich_su_trang_thai: {
          orderBy: { thoi_gian_tao: "desc" },
          take: 1,
          select: { ten: true, thoi_gian_tao: true },
        },
        danh_gia_phan_anh: {
          where: { is_active: true, is_delete: false },
          select: {
            id: true,
            diem: true,
            nhan_xet: true,
            thoi_gian_tao: true,
          },
        },
      },
    });
  },

  async create(data) {
    return prisma.danh_gia_phan_anh.create({ data });
  },

  async findAll(filters) {
    const where = getRatingWhere(filters);
    const [data, totalItems] = await Promise.all([
      prisma.danh_gia_phan_anh.findMany({
        where,
        orderBy: { thoi_gian_tao: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        select: ratingSelect,
      }),
      prisma.danh_gia_phan_anh.count({ where }),
    ]);
    return { data, totalItems };
  },

  async getStatistics(filters) {
    const where = getRatingWhere(filters);
    const [overall, scoreGroups, ratings] = await Promise.all([
      prisma.danh_gia_phan_anh.aggregate({
        where,
        _count: { _all: true },
        _avg: { diem: true },
      }),
      prisma.danh_gia_phan_anh.groupBy({
        by: ["diem"],
        where,
        _count: { _all: true },
        orderBy: { diem: "asc" },
      }),
      prisma.danh_gia_phan_anh.findMany({ where, select: ratingSelect }),
    ]);
    return { overall, scoreGroups, ratings };
  },

  async findDetail(id, scopedLinhVucIds) {
    return prisma.danh_gia_phan_anh.findFirst({
      where: {
        id,
        is_active: true,
        is_delete: false,
        phan_anh: getComplaintScope(scopedLinhVucIds),
      },
      select: ratingSelect,
    });
  },
};

export default PhanAnhRatingRepository;
