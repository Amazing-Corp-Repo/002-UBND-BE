import prisma from "../config/database.config.js";

const ReportRepository = {
  async getReportPhanAnh(from, to, idLinhVuc) {
    let whereClause = {
      ...(idLinhVuc && { id_linh_vuc_phan_anh: idLinhVuc }),
    };
    let whereClauseNotIncludeLinhVuc = {};
    if (from && to) {
      whereClause.thoi_gian_tao = {
        gte: from,
        lte: to,
      };
      whereClauseNotIncludeLinhVuc.thoi_gian_tao = {
        gte: from,
        lte: to,
      };
    }

    let phanAnh = await prisma.phan_anh.findMany({
      where: whereClause,
      select: {
        id: true,
        linh_vuc_phan_anh: {
          select: {
            id: true,
            ten: true,
          },
        },
        thoi_gian_tao: true,
        lich_su_trang_thai: {
          orderBy: {
            thoi_gian_tao: "desc",
          },
          take: 1,
          select: {
            ten: true,
          },
        },
      },
    });

    let phanAnhMoiCapNhat = await prisma.phan_anh.findMany({
      select: {
        ma_phan_anh: true,
        tieu_de: true,
        linh_vuc_phan_anh: {
          select: {
            ten: true,
          },
        },
        lich_su_trang_thai: {
          orderBy: {
            thoi_gian_tao: "desc",
          },
          take: 1,
          select: {
            ten: true,
            thoi_gian_tao: true,
          },
        },
        thoi_gian_cap_nhat: true,
      },
      orderBy: {
        thoi_gian_cap_nhat: "desc",
      },
      take: 5,
    });

    let linh_vuc = await prisma.linh_vuc_phan_anh.findMany({
      where: {
        is_active: true,
        is_delete: false,
      },
      select: {
        id: true,
        ten: true,
        phan_anh: {
          select: {
            id: true,
            lich_su_trang_thai: {
              orderBy: {
                thoi_gian_tao: "desc",
              },
              select: {
                ten: true,
                thoi_gian_tao: true,
              },
            },
          },
        },
      },
    });

    let totalPhanAnh = await prisma.phan_anh.count({
      where: whereClauseNotIncludeLinhVuc,
    });

    return { phanAnh, phanAnhMoiCapNhat, linh_vuc, totalPhanAnh };
  },

  async getReportThuTuc(from, to) {
    let whereClause = {};
    if (from && to) {
      whereClause.thoi_gian_tao = {
        gte: from,
        lte: to,
      };
    }

    let linhVuc = await prisma.thu_tuc_hanh_chinh.findMany({
      where: whereClause,
      select: {
        thu_tuc_hanh_chinh_linh_vuc: {
          select: {
            linh_vuc: {
              select: {
                id: true,
                ten_linh_vuc: true,
              },
            },
          },
        },
        id: true,
      },
    });

    const [totalThuTuc, totalThuTucCoMauDon] = await Promise.all([
      prisma.thu_tuc_hanh_chinh.count({
        where: {
          is_delete: false,
          is_active: true,
        }
      }),
      prisma.thu_tuc_hanh_chinh.count({
        where: {
          thu_tuc_hanh_chinh_mau_don: {
            some: {},
          },
          is_delete: false,
          is_active: true,
        },
      }),
    ]);

    return { linhVuc, totalThuTuc, totalThuTucCoMauDon };
  },

  async getReportTinTuc(from, to) {
    let whereClause = {};
    if (from && to) {
      whereClause.thoi_gian_tao = {
        gte: from,
        lte: to,
      };
    }

    let data = await prisma.tin_tuc.findMany({
      where: {
        ...whereClause,
        is_delete: false,
        is_active: true,
      },
      select: {
        is_noti: true,
        id: true,
        thoi_gian_tao: true,
        _count: { select: { tin_tuc_view: true } },
      },
      orderBy: { thoi_gian_tao: "asc" },
    });

    return { tinTucLists: data };
  },
};

export default ReportRepository;
