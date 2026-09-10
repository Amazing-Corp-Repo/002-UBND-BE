import prisma from "../config/database.config.js";
import PHAN_ANH_EXTENSION_STATUS from "../constants/phan-anh-extension-status.constant.js";

const extensionInclude = {
  phan_anh: {
    include: {
      linh_vuc_phan_anh: { select: { id: true, ten: true } },
      to_phu_trach: { select: { id: true, ho_va_ten: true, email: true } },
      lich_su_trang_thai: {
        orderBy: { thoi_gian_tao: "desc" },
        take: 1,
        select: { ten: true, thoi_gian_tao: true },
      },
    },
  },
  nguoi_de_nghi: { select: { id: true, ho_va_ten: true, email: true } },
  nguoi_duyet: { select: { id: true, ho_va_ten: true, email: true } },
  de_nghi_gia_han_file: true,
};

const PhanAnhExtensionRepository = {
  async findComplaintById(idPhanAnh) {
    return prisma.phan_anh.findUnique({
      where: { id: idPhanAnh },
      include: {
        lich_su_trang_thai: {
          orderBy: { thoi_gian_tao: "desc" },
          take: 1,
          select: { ten: true, thoi_gian_tao: true },
        },
        linh_vuc_phan_anh: { select: { id: true, ten: true } },
      },
    });
  },

  async createIfNoPending(data, files = []) {
    return prisma.$transaction(async (tx) => {
      // Serialise extension requests for a complaint without adding a restrictive
      // DB unique constraint (approved/rejected requests may legitimately recur).
      await tx.$executeRawUnsafe(
        "SELECT pg_advisory_xact_lock(hashtext($1))",
        data.id_phan_anh,
      );
      const pending = await tx.de_nghi_gia_han_phan_anh.findFirst({
        where: {
          id_phan_anh: data.id_phan_anh,
          trang_thai: PHAN_ANH_EXTENSION_STATUS.PENDING,
        },
        select: { id: true },
      });
      if (pending) return null;

      return tx.de_nghi_gia_han_phan_anh.create({
        data: {
          ...data,
          ...(files.length > 0
            ? { de_nghi_gia_han_file: { create: files } }
            : {}),
        },
        include: extensionInclude,
      });
    });
  },

  async getList({ status, page, size, search, mucDo, idLinhVuc, scopedLinhVucIds }) {
    const skip = (page - 1) * size;
    const complaintFilters = [
      ...(Array.isArray(scopedLinhVucIds)
        ? [{ id_linh_vuc_phan_anh: { in: scopedLinhVucIds } }]
        : []),
      ...(idLinhVuc ? [{ id_linh_vuc_phan_anh: idLinhVuc }] : []),
      ...(mucDo ? [{ muc_do: mucDo }] : []),
    ];
    const where = {
      ...(status !== "ALL" ? { trang_thai: status } : {}),
      ...(complaintFilters.length > 0 ? { phan_anh: { is: { AND: complaintFilters } } } : {}),
      ...(search
        ? {
            OR: [
              { ly_do_gia_han: { contains: search, mode: "insensitive" } },
              { phan_anh: { is: { ma_phan_anh: { contains: search, mode: "insensitive" } } } },
              { phan_anh: { is: { tieu_de: { contains: search, mode: "insensitive" } } } },
              { nguoi_de_nghi: { is: { ho_va_ten: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };
    const [data, totalItems] = await prisma.$transaction([
      prisma.de_nghi_gia_han_phan_anh.findMany({
        where,
        include: extensionInclude,
        orderBy: { thoi_gian_tao: "desc" },
        skip,
        take: size,
      }),
      prisma.de_nghi_gia_han_phan_anh.count({ where }),
    ]);
    return { data, totalItems };
  },

  async getById(id) {
    return prisma.de_nghi_gia_han_phan_anh.findUnique({
      where: { id },
      include: extensionInclude,
    });
  },

  async approve(id, userId, ghiChu) {
    return prisma.$transaction(async (tx) => {
      const extension = await tx.de_nghi_gia_han_phan_anh.findUnique({
        where: { id },
        include: { phan_anh: { select: { id: true, ma_phan_anh: true } } },
      });
      if (!extension || extension.trang_thai !== PHAN_ANH_EXTENSION_STATUS.PENDING) return null;

      const now = new Date();
      const updateResult = await tx.de_nghi_gia_han_phan_anh.updateMany({
        where: { id, trang_thai: PHAN_ANH_EXTENSION_STATUS.PENDING },
        data: {
          trang_thai: PHAN_ANH_EXTENSION_STATUS.APPROVED,
          id_nguoi_duyet: userId,
          thoi_gian_duyet: now,
        },
      });
      if (updateResult.count !== 1) return null;
      await tx.phan_anh.update({
        where: { id: extension.id_phan_anh },
        data: {
          ngay_du_kien_hoan_thanh: extension.han_de_xuat_moi,
          nguoi_cap_nhat: userId,
          thoi_gian_cap_nhat: now,
        },
      });
      await tx.lich_su_trang_thai.create({
        data: {
          id_phan_anh: extension.id_phan_anh,
          ten: "Đã gia hạn",
          ghi_chu: ghiChu || "Đề nghị gia hạn đã được phê duyệt",
          nguoi_tao: userId,
        },
      });
      return { complaintCode: extension.phan_anh.ma_phan_anh };
    });
  },

  async reject(id, userId, lyDoTuChoi) {
    return prisma.$transaction(async (tx) => {
      const extension = await tx.de_nghi_gia_han_phan_anh.findUnique({
        where: { id },
        include: { phan_anh: { select: { ma_phan_anh: true } } },
      });
      if (!extension || extension.trang_thai !== PHAN_ANH_EXTENSION_STATUS.PENDING) return null;

      const updateResult = await tx.de_nghi_gia_han_phan_anh.updateMany({
        where: { id, trang_thai: PHAN_ANH_EXTENSION_STATUS.PENDING },
        data: {
          trang_thai: PHAN_ANH_EXTENSION_STATUS.REJECTED,
          id_nguoi_duyet: userId,
          ly_do_tu_choi: lyDoTuChoi,
          thoi_gian_duyet: new Date(),
        },
      });
      if (updateResult.count !== 1) return null;
      return {
        complaintCode: extension.phan_anh.ma_phan_anh,
      };
    });
  },
};

export default PhanAnhExtensionRepository;
