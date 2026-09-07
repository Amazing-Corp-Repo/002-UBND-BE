import prisma from "../config/database.config.js";

const extensionInclude = {
  phan_anh: {
    select: {
      id: true,
      ma_phan_anh: true,
      tieu_de: true,
      ngay_du_kien_hoan_thanh: true,
      id_to: true,
      lich_su_trang_thai: {
        orderBy: { thoi_gian_tao: "desc" },
        take: 1,
        select: { ten: true, thoi_gian_tao: true },
      },
    },
  },
  dinh_kem_de_nghi_gia_han: {
    select: {
      id: true,
      dinh_dang_file: true,
      url_file: true,
      kich_thuoc_file_mb: true,
      thoi_gian_tao: true,
    },
  },
};

const PhanAnhExtensionRepository = {
  async findComplaintForExtension(idPhanAnh) {
    return prisma.phan_anh.findUnique({
      where: { id: idPhanAnh },
      select: {
        id: true,
        ma_phan_anh: true,
        id_to: true,
        ngay_du_kien_hoan_thanh: true,
        lich_su_trang_thai: {
          orderBy: { thoi_gian_tao: "desc" },
          take: 1,
          select: { ten: true },
        },
      },
    });
  },

  async findByComplaintId(idPhanAnh) {
    return prisma.de_nghi_gia_han_phan_anh.findUnique({
      where: { id_phan_anh: idPhanAnh },
      include: extensionInclude,
    });
  },

  async create(data, attachments) {
    return prisma.$transaction(async (tx) => {
      const extension = await tx.de_nghi_gia_han_phan_anh.create({ data });
      if (attachments.length > 0) {
        await tx.dinh_kem_de_nghi_gia_han_phan_anh.createMany({
          data: attachments.map((attachment) => ({
            ...attachment,
            id_de_nghi_gia_han: extension.id,
          })),
        });
      }
      return tx.de_nghi_gia_han_phan_anh.findUnique({
        where: { id: extension.id },
        include: extensionInclude,
      });
    });
  },

  async list({ trangThai, page, size }) {
    const where = trangThai ? { trang_thai: trangThai } : {};
    const [data, total] = await prisma.$transaction([
      prisma.de_nghi_gia_han_phan_anh.findMany({
        where,
        include: extensionInclude,
        orderBy: { thoi_gian_tao: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.de_nghi_gia_han_phan_anh.count({ where }),
    ]);
    return { data, total };
  },

  async approve(idPhanAnh, currentUser) {
    return prisma.$transaction(async (tx) => {
      const extension = await tx.de_nghi_gia_han_phan_anh.findUnique({
        where: { id_phan_anh: idPhanAnh },
      });
      if (!extension) return null;

      const updated = await tx.de_nghi_gia_han_phan_anh.updateMany({
        where: { id: extension.id, trang_thai: "PENDING" },
        data: {
          trang_thai: "APPROVED",
          nguoi_duyet: currentUser,
          thoi_gian_cap_nhat: new Date(),
        },
      });
      if (updated.count !== 1) return { conflict: true };

      await tx.phan_anh.update({
        where: { id: idPhanAnh },
        data: {
          ngay_du_kien_hoan_thanh: extension.ngay_de_xuat_hoan_thanh,
          nguoi_cap_nhat: currentUser,
          thoi_gian_cap_nhat: new Date(),
        },
      });

      return tx.de_nghi_gia_han_phan_anh.findUnique({
        where: { id: extension.id },
        include: extensionInclude,
      });
    });
  },

  async reject(idPhanAnh, lyDoTuChoi, currentUser) {
    const updated = await prisma.de_nghi_gia_han_phan_anh.updateMany({
      where: { id_phan_anh: idPhanAnh, trang_thai: "PENDING" },
      data: {
        trang_thai: "REJECTED",
        ly_do_tu_choi: lyDoTuChoi,
        nguoi_tu_choi: currentUser,
        thoi_gian_cap_nhat: new Date(),
      },
    });
    if (updated.count !== 1) return null;
    return this.findByComplaintId(idPhanAnh);
  },
};

export default PhanAnhExtensionRepository;
