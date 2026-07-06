import prisma from "../config/database.config.js";

const UserRepository = {
  async findUserByUsername(ten_dang_nhap) {
    return await prisma.nguoi_dung.findUnique({
      where: {
        ten_dang_nhap,
        is_delete: false,
      },
    });
  },

  async createUser(userData) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.nguoi_dung.create({
        data: {
          ten_dang_nhap: userData.ten_dang_nhap,
          email: userData.email,
          mat_khau: userData.mat_khau,
          ho_va_ten: userData.ho_va_ten,
          so_dien_thoai: userData.so_dien_thoai,
          nguoi_tao: userData.nguoi_tao,
        },
      });

      await tx.user_roles.create({
        data: {
          user_id: user.id,
          role_id: userData.vai_tro,
        },
      });

      return user;
    });
  },

  async createAdminAccount(userData) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.nguoi_dung.create({
        data: {
          ten_dang_nhap: userData.ten_dang_nhap,
          email: userData.email,
          mat_khau: userData.mat_khau,
          nguoi_tao: userData.nguoi_tao,
        },
      });
      return user;
    });
  },

  async updateUserByAdmin(userId, updateData, roleId) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.nguoi_dung.update({
        where: { id: userId },
        data: updateData,
      });

      if (roleId) {
        await tx.user_roles.deleteMany({
          where: { user_id: userId },
        });

        await tx.user_roles.create({
          data: {
            user_id: userId,
            role_id: roleId,
          },
        });
      }

      return user;
    });
  },

  async updateUser(userId, updateData) {
    return await prisma.nguoi_dung.update({
      where: { id: userId },
      data: updateData,
    });
  },

  async findById(userId) {
    if (!userId) return null;
    return await prisma.nguoi_dung.findUnique({
      where: {
        id: userId,
        is_delete: false,
      },
      include: {
        user_roles: {
          select: {
            roles: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  },

  async getAllUsers(page, size, isActive, role, search) {
    const whereBase = {
      is_delete: false,
      ...(isActive !== undefined && isActive !== ""
        ? { is_active: isActive === "true" }
        : {}),
      ...(search
        ? {
            OR: [
              { ten_dang_nhap: { contains: search, mode: "insensitive" } },
              { ho_va_ten: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const roleFilter = role
      ? {
          user_roles: {
            some: {
              role_id: role,
            },
          },
        }
      : {};

    const finalWhere = {
      ...whereBase,
      ...roleFilter,
    };

    const skip = (page - 1) * size;

    const [users, total] = await Promise.all([
      prisma.nguoi_dung.findMany({
        skip,
        take: size,
        where: finalWhere,
        orderBy: { ten_dang_nhap: "asc" },
        include: {
          user_roles: {
            select: {
              roles: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.nguoi_dung.count({ where: finalWhere }),
    ]);

    return { users, total };
  },

  async getUserStatistics() {
    const where = { is_delete: false };
    const [total, inactive, roleGroups, roles] = await Promise.all([
      prisma.nguoi_dung.count({ where }),
      prisma.nguoi_dung.count({ where: { ...where, is_active: false } }),
      // PK [user_id, role_id] là duy nhất → đếm rows theo role_id = số user của vai trò.
      // Lọc theo nguoi_dung không bị xóa mềm.
      prisma.user_roles.groupBy({
        by: ["role_id"],
        where: { nguoi_dung: { is_delete: false } },
        _count: { _all: true },
      }),
      prisma.roles.findMany({ select: { id: true, name: true } }),
    ]);

    const roleNameById = new Map(roles.map((r) => [r.id, r.name]));
    const byRole = {};
    for (const g of roleGroups) {
      const name = roleNameById.get(g.role_id);
      if (name) byRole[name] = (byRole[name] || 0) + g._count._all;
    }

    // active = phần còn lại (is_active true hoặc null) — khớp ngữ nghĩa UI "!== false".
    return { total, active: total - inactive, inactive, byRole };
  },

  async findByUsernameOrEmail(ten_dang_nhap, email) {
    return await prisma.nguoi_dung.findFirst({
      where: {
        OR: [{ ten_dang_nhap }, { email }],
        is_delete: false,
      },
    });
  },

  async findByUsernameOrEmailList(ten_dang_nhap, email) {
    return await prisma.nguoi_dung.findMany({
      where: {
        OR: [{ ten_dang_nhap }, { email }],
        is_delete: false,
      },
    });
  },

  async findByUsername(ten_dang_nhap) {
    return await prisma.nguoi_dung.findFirst({
      where: {
        ten_dang_nhap,
        is_delete: false,
      },
    });
  },

  async findByEmail(email) {
    return await prisma.nguoi_dung.findFirst({
      where: {
        email,
        is_delete: false,
      },
    });
  },

  async updateStatusByAdmin(userId, isActive, currentUser) {
    return await prisma.nguoi_dung.update({
      where: { id: userId },
      data: {
        is_active: isActive,
        nguoi_cap_nhat: currentUser,
        thoi_gian_cap_nhat: new Date().toISOString(),
      },
    });
  },

  async countUserByIds(userIds) {
    return await prisma.nguoi_dung.count({
      where: {
        id: { in: userIds },
        is_delete: false,
        is_active: true,
      },
    });
  },

  async findEmailsByIds(userIds) {
    const users = await prisma.nguoi_dung.findMany({
      where: {
        id: { in: userIds },
        is_delete: false,
        is_active: true,
      },
      select: { email: true },
    });
    return users.map((u) => u.email?.trim()).filter(Boolean);
  },

  async getAllAdmin() {
    const adminUsers = await prisma.nguoi_dung.findMany({
      where: {
        is_delete: false,
        user_roles: {
          some: {
            roles: {
              name: "ADMIN",
            },
          },
        },
      },
      select: {
        email: true,
      },
    });
    return adminUsers.map((user) => user.email).filter(Boolean);
  },

  async findEmailsByRoleId(roleId) {
    const users = await prisma.nguoi_dung.findMany({
      where: {
        is_delete: false,
        user_roles: { some: { role_id: roleId } },
      },
      select: { email: true },
    });
    return users.map((u) => u.email?.trim()).filter(Boolean);
  },

  async findEmailsByRoleId(roleId) {
    const users = await prisma.nguoi_dung.findMany({
      where: {
        is_delete: false,
        user_roles: { some: { role_id: roleId } },
      },
      select: { email: true },
    });
    return users.map((u) => u.email?.trim()).filter(Boolean);
  },

  async searchUsers(search) {
    const whereBase = {
      is_delete: false,
      is_active: true,
      ...(search
        ? {
            OR: [
              { ten_dang_nhap: { contains: search, mode: "insensitive" } },
              { ho_va_ten: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const users = await prisma.nguoi_dung.findMany({
      where: whereBase,
      select: {
        id: true,
        ho_va_ten: true,
        ten_dang_nhap: true,
        email: true,
      },
    });
    return users;
  },

  async findUsersByRoleName(roleName) {
    return await prisma.nguoi_dung.findMany({
      where: {
        is_delete: false,
        is_active: true,
        user_roles: {
          some: {
            roles: {
              name: {
                equals: roleName,
                mode: "insensitive",
              },
            },
          },
        },
      },
      orderBy: {
        ten_dang_nhap: "asc",
      },
      select: {
        id: true,
        ten_dang_nhap: true,
      },
    });
  },

  async findUsersByPermissionCode(permissionCode) {
    return await prisma.nguoi_dung.findMany({
      where: {
        is_delete: false,
        is_active: true,
        email: { not: null },
        user_roles: {
          some: {
            roles: {
              is_delete: false,
              is_active: true,
              role_permissions: {
                some: { permission_code: permissionCode },
              },
            },
          },
        },
      },
      orderBy: {
        ten_dang_nhap: "asc",
      },
      select: {
        id: true,
        ho_va_ten: true,
        email: true,
      },
    });
  },
};

export default UserRepository;
