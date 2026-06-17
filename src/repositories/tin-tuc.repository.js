import prisma from "../config/database.config.js";

const TinTucRepository = {
  async create(data) {
    return prisma.tin_tuc.create({
      data,
    });
  },

  async findById(id) {
    return prisma.tin_tuc.findFirst({
      where: {
        id: id,
      },
    });
  },

  async update(id, data) {
    return prisma.tin_tuc.update({
      where: { id },
      data,
    });
  },

  async getDetails(id) {
    const result = await prisma.tin_tuc.findFirst({
      where: {
        id,
        is_delete: false,
      },
      include: {
        dinh_kem_tin_tuc: true,
        danh_muc_tin_tuc: true,
        // _count.tin_tuc_view = số người xem DUY NHẤT (theo ip+device).
        _count: {
          select: { tin_tuc_view: true },
        },
      },
    });
    if (result) {
      // luot_xem = TỔNG lượt xem thật (gồm cả lượt lặp lại) = SUM(view_count).
      const agg = await prisma.tin_tuc_view.aggregate({
        where: { id_tin_tuc: id },
        _sum: { view_count: true },
      });
      result.luot_xem = agg._sum.view_count || 0;
    }
    return result;
  },

  async getAll(page, size, idDanhMuc, isActive, search) {
    const skip = (page - 1) * size;
    const where = {
      ...(isActive !== undefined && isActive !== ""
        ? { is_active: isActive === "true" }
        : {}),
      ...(idDanhMuc ? { id_danh_muc: idDanhMuc } : {}),
      is_delete: false,
      ...(search !== undefined && search !== ""
        ? { tieu_de: { contains: search, mode: "insensitive" } }
        : {}),
    };
    const [data, totalItems] = await Promise.all([
      prisma.tin_tuc.findMany({
        where,
        skip,
        take: size,
        orderBy: {
          thoi_gian_tao: "desc",
        },
        include: {
          danh_muc_tin_tuc: true,
          _count: { select: { tin_tuc_view: true } },
        },
      }),
      prisma.tin_tuc.count({ where }),
    ]);

    // Gắn TỔNG lượt xem thật (SUM view_count) cho từng bài trong trang.
    // (_count.tin_tuc_view chỉ là số người xem duy nhất theo ip+device.)
    const ids = data.map((d) => d.id);
    const sums = ids.length
      ? await prisma.tin_tuc_view.groupBy({
          by: ["id_tin_tuc"],
          where: { id_tin_tuc: { in: ids } },
          _sum: { view_count: true },
        })
      : [];
    const sumMap = new Map(
      sums.map((s) => [s.id_tin_tuc, s._sum.view_count || 0])
    );
    data.forEach((d) => {
      d.luot_xem = sumMap.get(d.id) || 0;
    });

    return { data, totalItems };
  },

  async findByIdDanhMuc(id) {
    return prisma.tin_tuc.findFirst({
      where: {
        id_danh_muc: id,
        is_delete: false,
      },
    });
  },

  async getTinTucAndUpdateViewCount(id, ip, deviceInfo) {
    const tinTuc = await prisma.tin_tuc.findFirst({
      where: {
        id,
        is_delete: false,
        is_active: true,
      },
      include: {
        dinh_kem_tin_tuc: true,
        danh_muc_tin_tuc: true,
        _count: {
          select: { tin_tuc_view: true },
        },
      },
    });
    if (!tinTuc) {
      throw new BaseError(404, "Tin tức không tồn tại hoặc không hoạt động");
    }

    const viewRecord = await prisma.tin_tuc_view.findUnique({
      where: {
        id_tin_tuc_ip_address_device_info: {
          id_tin_tuc: id,
          ip_address: ip,
          device_info: deviceInfo,
        },
      },
    });

    if (!viewRecord) {
      await prisma.tin_tuc_view.create({
        data: {
          id_tin_tuc: id,
          ip_address: ip,
          device_info: deviceInfo,
        },
      });
      return tinTuc;
    }

    const now = new Date();
    const lastViewedAt = new Date(viewRecord.last_view_at);
    const timeDifference = (now - lastViewedAt) / (1000 * 60 * 60);

    if (timeDifference < 1) {
      return tinTuc;
    }

    await prisma.tin_tuc_view.update({
      where: {
        id_tin_tuc_ip_address_device_info: {
          id_tin_tuc: id,
          ip_address: ip,
          device_info: deviceInfo,
        },
      },
      data: {
        last_view_at: now,
        view_count: { increment: 1 },
      },
    });

    return tinTuc;
  },
};

export default TinTucRepository;
