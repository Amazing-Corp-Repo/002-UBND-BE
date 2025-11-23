import prisma from "../config/database.config.js";

const RoleRepository = {
  async createRole({ name, description, permissionIds, nguoi_tao }) {
    return await prisma.$transaction(async (tx) => {
      const role = await tx.roles.create({
        data: {
          name,
          description,
          nguoi_tao,
        },
      });

      if (permissionIds && permissionIds.length > 0) {
        await tx.role_permissions.createMany({
          data: permissionIds.map((permissionId) => ({
            role_id: role.id,
            permission_id: permissionId,
          })),
        });
      }

      return role;
    });
  },

  async findRoleByName(name) {
    return await prisma.roles.findUnique({
      where: {
        name,
      },
    });
  },

  async findUserRolesByUserIdAndRoleId(userId, roleId) {
    return await prisma.user_roles.findFirst({
      where: {
        user_id: userId,
        role_id: roleId,
      },
    });
  },

  async assignRoleToUser(userId, roleId) {
    return await prisma.user_roles.create({
      data: {
        user_id: userId,
        role_id: roleId,
      },
    });
  },

  async addPermissionsToRole(roleId, permissionIds) {
    return prisma.role_permissions.createMany({
      data: permissionIds.map((id) => ({
        role_id: roleId,
        permission_id: id,
      })),
      skipDuplicates: true,
    });
  },

  async syncAdminRolePermissions(adminRoleId) {
    const allPermissions = await prisma.permissions.findMany({
      select: { id: true },
    });

    const existing = await prisma.role_permissions.findMany({
      where: { role_id: adminRoleId },
      select: { permission_id: true },
    });

    const existingIds = new Set(existing.map((e) => e.permission_id));
    const missing = allPermissions
      .filter((p) => !existingIds.has(p.id))
      .map((p) => p.id);

    if (missing.length > 0) {
      await this.addPermissionsToRole(adminRoleId, missing);
    }

    return missing;
  },

  async findAllRolesWithPagination(isActive, search, page, size) {
    const where = {
      ...(isActive !== undefined && isActive !== ""
        ? { is_active: isActive === "true" }
        : {}),
      is_delete: false,
      ...(search
        ? {
            OR: [{ name: { contains: search, mode: "insensitive" } }],
          }
        : {}),
    };
    const [roles, totalItems] = await Promise.all([
      prisma.roles.findMany({
        where,
        orderBy: {
          thoi_gian_tao: "desc",
        },
        skip: (page - 1) * size,
        take: size,
        include: {
          _count: {
            select: { role_permissions: true },
          },
        },
      }),
      prisma.roles.count({ where }),
    ]);
    const data = roles.map((r) => ({
      ...r,
      permissionCount: r._count.role_permissions,
      _count: undefined,
    }));

    return { data, totalItems };
  },

  async findAll(search) {
    const where = {
      is_delete: false,
      ...(search
        ? {
            OR: [{ name: { contains: search, mode: "insensitive" } }],
          }
        : {}),
      is_active: true,
    };
    return await prisma.roles.findMany({
      where,
      orderBy: {
        thoi_gian_tao: "desc",
      },
    });
  },

  async getRoleDetails(roleId) {
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        role_permissions: {
          include: { permissions: {
            select: {
              id: true,
              description: true,
            },
          } },
        },
      },
    });

    if (!role) {
      return null;
    }

    return {
      ...role,
      permissions: role.role_permissions.map((rp) => rp.permissions),
      role_permissions: undefined,
    };
  },

  async getById(roleId) {
    return prisma.roles.findUnique({
      where: { id: roleId },
    });
  },

  async countUserWithRole(roleId) {
    return prisma.user_roles.count({
      where: { role_id: roleId },
    });
  },

  async update(id, data) {
    return prisma.roles.update({
      where: { id },
      data,
    });
  },

  async updateAll(roleId, data, permissionIds) {
    return await prisma.$transaction(async (tx) => {
      const role = await tx.roles.update({
        where: { id: roleId },
        data,
      });
      await tx.role_permissions.deleteMany({
        where: { role_id: roleId },
      });
      if (permissionIds && permissionIds.length > 0) {
        await tx.role_permissions.createMany({
          data: permissionIds.map((permissionId) => ({
            role_id: roleId,
            permission_id: permissionId,
          })),
        });
      }
      return role;
    });
  }
};

export default RoleRepository;
