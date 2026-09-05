import prisma from "../config/database.config.js";
import {
  PERMISSION,
  PERMISSION_DESC,
} from "../constants/permission.constant.js";

const PermissionRepository = {

  async syncPermissions() {
    const permissionList = Object.values(PERMISSION);

    const permissionData = permissionList.map((code) => ({
      code,
      description: PERMISSION_DESC[code] || null,
    }));

    const exist = await prisma.permissions.findMany({
      select: { code: true, description: true },
    });

    const existMap = new Map(exist.map((p) => [p.code, p]));

    const toInsert = [];
    for (const item of permissionData) {
      const existing = existMap.get(item.code);

      if (!existing) {
        toInsert.push(item);
      }
    }

    if (toInsert.length > 0) {
      await prisma.permissions.createMany({
        data: toInsert,
        skipDuplicates: true,
      });
    }

    return {
      total: permissionList.length,
      inserted: toInsert.length,
      updated: 0,
      deleted: 0,
      unchanged: permissionList.length - toInsert.length,
    };
  },

  async findManyByCode(codes) {
    return await prisma.permissions.findMany({
      where: { code: { in: codes } },
    });
  },

  async getPermissionsByUserId(userId) {
    const records = await prisma.user_roles.findMany({
      where: { user_id: userId },
      select: {
        roles: {
          select: {
            role_permissions: {
              select: {
                permissions: {
                  select: { code: true },
                },
              },
            },
          },
        },
      },
    });

    const permissions = records.flatMap((r) =>
      r.roles.role_permissions.map((p) => p.permissions.code)
    );

    return [...new Set(permissions)];
  },
};

export default PermissionRepository;
