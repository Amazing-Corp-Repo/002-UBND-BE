import prisma from "../config/database.config.js";

const ThuVienRepository = {
  async getAll({ loai, page, size, search, idDanhMuc, trangThai, phamVi, aiDaHoc, dateFrom, dateTo, sortBy, sortOrder, coQuanBanHanh, isDelete = false }) {
    const skip = (page - 1) * size;
    const where = {
      loai,
      is_delete: isDelete,
      ...(search ? {
        OR: [
          { tieu_de: { contains: search, mode: "insensitive" } },
          { mo_ta: { contains: search, mode: "insensitive" } },
          { so_hieu: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
      ...(idDanhMuc ? { id_danh_muc: idDanhMuc } : {}),
      ...(trangThai ? { trang_thai: trangThai } : {}),
      ...(phamVi ? { pham_vi: phamVi } : {}),
      ...(aiDaHoc !== undefined && aiDaHoc !== "" ? { ai_da_hoc: aiDaHoc === "true" } : {}),
      ...(coQuanBanHanh ? { co_quan_ban_hanh: { contains: coQuanBanHanh, mode: "insensitive" } } : {}),
      ...(dateFrom || dateTo ? {
        ngay_ban_hanh: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      } : {}),
    };

    const orderBy = {};
    if (sortBy && ["thoi_gian_tao", "tieu_de", "ngay_ban_hanh", "luot_xem", "so_luot_tai"].includes(sortBy)) {
      orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.thoi_gian_tao = "desc";
    }

    const [data, totalItems] = await Promise.all([
      prisma.thu_vien_tai_lieu.findMany({
        where,
        skip,
        take: size,
        orderBy,
        include: {
          thu_vien_danh_muc: {
            select: { id: true, ten: true },
          },
          thu_vien_tai_lieu_file: {
            where: { la_phien_ban_hien_tai: true, is_delete: false },
            select: { id: true, ten_file: true, duong_dan: true, kich_thuoc_mb: true, dinh_dang: true },
            take: 1,
          },
          thu_vien_tai_lieu_tag: {
            where: { thu_vien_tag: { is_delete: false } },
            select: {
              thu_vien_tag: {
                select: { id: true, ten: true },
              },
            },
          },
          _count: {
            select: { thu_vien_tai_lieu_media: true },
          },
        },
      }),
      prisma.thu_vien_tai_lieu.count({ where }),
    ]);

    return { data, totalItems };
  },

  async getById(id) {
    return prisma.thu_vien_tai_lieu.findFirst({
      where: { id, is_delete: false },
      include: {
        thu_vien_danh_muc: {
          select: { id: true, ten: true },
        },
        thu_vien_tai_lieu_file: {
          where: { la_phien_ban_hien_tai: true, is_delete: false },
          select: { id: true, ten_file: true, duong_dan: true, kich_thuoc_mb: true, dinh_dang: true },
          take: 1,
        },
        thu_vien_tai_lieu_media: {
          where: { is_delete: false },
          select: { id: true, loai: true, ten_file_goc: true, url: true, kich_thuoc: true, mime_type: true },
        },
        thu_vien_tai_lieu_tag: {
          where: { thu_vien_tag: { is_delete: false } },
          select: {
            thu_vien_tag: {
              select: { id: true, ten: true },
            },
          },
        },
      },
    });
  },

  async create(data) {
    return prisma.thu_vien_tai_lieu.create({ data });
  },

  async update(id, data) {
    return prisma.thu_vien_tai_lieu.update({
      where: { id },
      data,
    });
  },

  async softDelete(id, nguoiCapNhat) {
    return prisma.thu_vien_tai_lieu.update({
      where: { id },
      data: {
        is_delete: true,
        nguoi_cap_nhat: nguoiCapNhat,
        thoi_gian_cap_nhat: new Date().toISOString(),
      },
    });
  },

  async findById(id) {
    return prisma.thu_vien_tai_lieu.findFirst({
      where: { id, is_delete: false },
    });
  },

  async getStatistics(loai) {
    const where = { loai, is_delete: false };

    const [total, approved, pending, revoked, aiLearned, viewAgg, downloadAgg] = await Promise.all([
      prisma.thu_vien_tai_lieu.count({ where }),
      prisma.thu_vien_tai_lieu.count({ where: { ...where, trang_thai: "DA_DUYET" } }),
      prisma.thu_vien_tai_lieu.count({ where: { ...where, trang_thai: "CHO_DUYET" } }),
      prisma.thu_vien_tai_lieu.count({ where: { ...where, trang_thai: "LUU_TRU" } }),
      prisma.thu_vien_tai_lieu.count({ where: { ...where, ai_da_hoc: true } }),
      prisma.thu_vien_tai_lieu.aggregate({ where, _sum: { luot_xem: true } }),
      prisma.thu_vien_tai_lieu.aggregate({ where, _sum: { so_luot_tai: true } }),
    ]);

    return {
      total,
      approved,
      pending,
      revoked,
      aiLearned,
      totalViews: viewAgg._sum.luot_xem || 0,
      totalDownloads: downloadAgg._sum.so_luot_tai || 0,
    };
  },

  async getSubCategories(loai) {
    const result = await prisma.thu_vien_danh_muc.findMany({
      where: { is_delete: false, is_active: true },
      select: {
        id: true,
        ten: true,
        thu_tu: true,
        _count: {
          select: { thu_vien_tai_lieu: { where: { loai, is_delete: false } } },
        },
      },
      orderBy: { thu_tu: "asc" },
    });

    return result.map((item) => ({
      id: item.id,
      name: item.ten,
      sortOrder: item.thu_tu,
      documentCount: item._count.thu_vien_tai_lieu,
    }));
  },

  async getDocTypes() {
    const result = await prisma.thu_vien_danh_muc.findMany({
      where: { is_delete: false, is_active: true },
      select: {
        id: true,
        ten: true,
        thu_tu: true,
        _count: {
          select: { thu_vien_tai_lieu: { where: { loai: "PHAP_LUAT", is_delete: false } } },
        },
      },
      orderBy: { thu_tu: "asc" },
    });

    return result.map((item) => ({
      id: item.id,
      name: item.ten,
      sortOrder: item.thu_tu,
      documentCount: item._count.thu_vien_tai_lieu,
    }));
  },

  async getIssuingAgencies() {
    const result = await prisma.thu_vien_tai_lieu.groupBy({
      by: ["co_quan_ban_hanh"],
      where: {
        loai: "PHAP_LUAT",
        is_delete: false,
        co_quan_ban_hanh: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    return result.map((item) => ({
      id: item.co_quan_ban_hanh,
      name: item.co_quan_ban_hanh,
      documentCount: item._count.id,
    }));
  },

  async createMedia(data) {
    return prisma.thu_vien_tai_lieu_media.create({ data });
  },

  async deleteMedia(id, mediaId) {
    return prisma.thu_vien_tai_lieu_media.update({
      where: { id: mediaId, id_tai_lieu: id },
      data: { is_delete: true },
    });
  },

  async findMediaById(id, mediaId) {
    return prisma.thu_vien_tai_lieu_media.findFirst({
      where: { id: mediaId, id_tai_lieu: id, is_delete: false },
    });
  },

  async incrementViewCount(id) {
    return prisma.thu_vien_tai_lieu.update({
      where: { id },
      data: { luot_xem: { increment: 1 } },
    });
  },

  async incrementDownloadCount(id) {
    return prisma.thu_vien_tai_lieu.update({
      where: { id },
      data: { so_luot_tai: { increment: 1 } },
    });
  },

  async createTagLink(idTaiLieu, idTag) {
    return prisma.thu_vien_tai_lieu_tag.create({
      data: { id_tai_lieu: idTaiLieu, id_tag: idTag },
    });
  },

  async deleteTagLinks(idTaiLieu) {
    return prisma.thu_vien_tai_lieu_tag.deleteMany({
      where: { id_tai_lieu: idTaiLieu },
    });
  },

  async findTagByName(ten) {
    return prisma.thu_vien_tag.findFirst({
      where: { ten: { equals: ten, mode: "insensitive" }, is_delete: false },
    });
  },

  async createTag(ten) {
    return prisma.thu_vien_tag.create({
      data: { ten },
    });
  },
};

export default ThuVienRepository;