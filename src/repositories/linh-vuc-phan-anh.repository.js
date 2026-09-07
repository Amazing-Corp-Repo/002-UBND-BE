import prisma from "../config/database.config.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";

const LinhVucPhanAnhRepository = {
  async findByName(ten) {
    return await prisma.linh_vuc_phan_anh.findFirst({
      where: {
        ten: ten,
        is_delete: false,
      },
    });
  },

  async createWithManagers({ ten, moTa, currentUser }, managerIds) {
    return await prisma.$transaction(async (tx) => {
      const linhVuc = await tx.linh_vuc_phan_anh.create({
        data: {
          ten,
          mo_ta: moTa,
          nguoi_tao: currentUser,
        },
      });

      const dataManagers = managerIds.map((uid) => ({
        id_linh_vuc_phan_anh: linhVuc.id,
        id_nguoi_dung: uid,
        nguoi_tao: currentUser,
        thoi_gian_tao: new Date().toISOString(),
      }));

      await tx.linh_vuc_phan_anh_nguoi_quan_ly.createMany({
        data: dataManagers,
      });

      return linhVuc;
    });
  },

  async getAll(page, size, search, isActive) {
    const skip = (page - 1) * size;
    const where = {
      ...(isActive !== undefined && isActive !== ""
        ? { is_active: isActive === "true" }
        : {}),
      is_delete: false,
      ...(search !== undefined && search !== ""
        ? { ten: { contains: search, mode: "insensitive" } }
        : {}),
    };
    const [data, totalItems] = await Promise.all([
      prisma.linh_vuc_phan_anh.findMany({
        where,
        skip,
        take: size,
        orderBy: {
          thoi_gian_tao: "desc",
        },
      }),
      prisma.linh_vuc_phan_anh.count({ where }),
    ]);
    return { data, totalItems };
  },

  async findById(id) {
    return await prisma.linh_vuc_phan_anh.findFirst({
      where: {
        id: id,
        is_delete: false,
      },
      select: {
        id: true,
        ten: true,
        mo_ta: true,
        is_active: true,
        is_delete: true,
        nguoi_tao: true,
        thoi_gian_tao: true,
        nguoi_cap_nhat: true,
        thoi_gian_cap_nhat: true,

        linh_vuc_phan_anh_nguoi_quan_ly: {
          select: {
            id_nguoi_dung: true,
            nguoi_dung_linh_vuc_phan_anh_nguoi_quan_ly_id_nguoi_dungTonguoi_dung:
              {
                select: {
                  id: true,
                  ho_va_ten: true,
                  email: true,
                  so_dien_thoai: true,
                },
              },
          },
        },
      },
    });
  },

  async updateWithManagers(id, data, newManagerIds, currentUser) {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.linh_vuc_phan_anh.update({
        where: { id },
        data,
      });

      const existingManagers =
        await tx.linh_vuc_phan_anh_nguoi_quan_ly.findMany({
          where: { id_linh_vuc_phan_anh: id },
          select: { id_nguoi_dung: true },
        });

      const existingIds = existingManagers.map((m) => m.id_nguoi_dung);

      const toAdd = newManagerIds.filter((uid) => !existingIds.includes(uid));
      const toRemove = existingIds.filter(
        (uid) => !newManagerIds.includes(uid)
      );

      if (toRemove.length > 0) {
        await tx.linh_vuc_phan_anh_nguoi_quan_ly.deleteMany({
          where: {
            id_linh_vuc_phan_anh: id,
            id_nguoi_dung: { in: toRemove },
          },
        });
      }

      if (toAdd.length > 0) {
        const insertData = toAdd.map((uid) => ({
          id_linh_vuc_phan_anh: id,
          id_nguoi_dung: uid,
          nguoi_tao: currentUser,
          thoi_gian_tao: new Date().toISOString(),
        }));

        await tx.linh_vuc_phan_anh_nguoi_quan_ly.createMany({
          data: insertData,
        });
      }

      // Trả thêm danh sách quản lý MỚI được thêm để service gửi mail đúng người
      // (tránh email lại cho người đã là quản lý từ trước).
      return { updated, addedManagerIds: toAdd };
    });
  },

  async update(id, data) {
    return await prisma.linh_vuc_phan_anh.update({
      where: { id },
      data,
    });
  },

  async findByNameExcludingId(id, ten) {
    return await prisma.linh_vuc_phan_anh.findFirst({
      where: {
        ten: ten,
        id: { not: id },
        is_delete: false,
      },
    });
  },

  async countActiveReflections(idLinhVuc) {
    const dong = PHAN_ANH_STATUS.DONG;
    const daGiaiQuyet = PHAN_ANH_STATUS.DA_GIAI_QUYET;

    const result = await prisma.$queryRawUnsafe(
      `
        SELECT COUNT(*)::int AS count
        FROM phan_anh pa
        LEFT JOIN LATERAL (
            SELECT lst.ten
            FROM lich_su_trang_thai lst
            WHERE lst.id_phan_anh = pa.id
            ORDER BY lst.thoi_gian_tao DESC
            LIMIT 1
        ) AS latest ON TRUE
        WHERE pa.id_linh_vuc_phan_anh = $1::uuid
        AND (latest.ten NOT IN ($2, $3));
    `,
      idLinhVuc,
      dong,
      daGiaiQuyet
    );

    return result[0]?.count ?? 0;
  },

  async countActiveReflectionsToDelete(idLinhVuc) {
    return await prisma.phan_anh.count({
      where: {
        id_linh_vuc_phan_anh: idLinhVuc,
      },
    });
  },

  async searchByName(search) {
    const where = {
      is_delete: false,
      ...(search !== undefined && search !== ""
        ? { ten: { contains: search, mode: "insensitive" } }
        : {}),
      is_active: true,
    };
    return await prisma.linh_vuc_phan_anh.findMany({
      where,
      orderBy: {
        thoi_gian_tao: "desc",
      },
    });
  },

  async getAllActiveLinhVucPhanAnh() {
    return await prisma.linh_vuc_phan_anh.findMany({
      where: {
        is_delete: false,
        is_active: true,
      },
      orderBy: {
        thoi_gian_tao: "desc",
      },
      select: {
        id: true,
        ten: true,
      },
    });
  },

  async getTenLinhVucById(id) {
    const linhVuc = await prisma.linh_vuc_phan_anh.findFirst({
      where: {
        id: id,
        is_delete: false,
      },
      select: {
        ten: true,
      },
    });
    return linhVuc ? linhVuc.ten : null;
  },

  async getLinhVucIdByUserId(userId) {
    const linhVucManagers = await prisma.linh_vuc_phan_anh_nguoi_quan_ly.findMany({
      where: {
        id_nguoi_dung: userId,
        linh_vuc_phan_anh: {
          is_active: true,
          is_delete: false,
        },
      },
      select: {
        id_linh_vuc_phan_anh: true,
      },
    });
    return linhVucManagers.map((manager) => manager.id_linh_vuc_phan_anh);
  },

  async getManagerEmailsByLinhVucId(linhVucId) {
    const managers = await prisma.linh_vuc_phan_anh_nguoi_quan_ly.findMany({
      where: {
        id_linh_vuc_phan_anh: linhVucId,
      },
      select: {
        nguoi_dung_linh_vuc_phan_anh_nguoi_quan_ly_id_nguoi_dungTonguoi_dung: {
          select: {
            email: true,
          },
        },
      },
    });
    return managers
      .map(
        (manager) =>
          manager
            .nguoi_dung_linh_vuc_phan_anh_nguoi_quan_ly_id_nguoi_dungTonguoi_dung
            .email
      )
      .filter((email) => email); // Lọc bỏ các email undefined hoặc null
  },

  async getManagersByLinhVucId(linhVucId) {
    const managers = await prisma.linh_vuc_phan_anh_nguoi_quan_ly.findMany({
      where: {
        id_linh_vuc_phan_anh: linhVucId,
      },
      select: {
        nguoi_dung_linh_vuc_phan_anh_nguoi_quan_ly_id_nguoi_dungTonguoi_dung: {
          select: {
            id: true,
            ho_va_ten: true,
            ten_dang_nhap: true,
            email: true,
            is_active: true,
            is_delete: true,
          },
        },
      },
    });
    return managers
      .map(
        (manager) =>
          manager
            .nguoi_dung_linh_vuc_phan_anh_nguoi_quan_ly_id_nguoi_dungTonguoi_dung,
      )
      .filter(
        (user) => user && user.is_active !== false && user.is_delete !== true,
      )
      .map(({ is_active, is_delete, ...user }) => user);
  },
};

export default LinhVucPhanAnhRepository;
