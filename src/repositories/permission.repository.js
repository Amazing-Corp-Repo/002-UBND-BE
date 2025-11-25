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
    const toUpdate = [];
    const keepCodes = new Set(permissionList);

    for (const item of permissionData) {
      const existing = existMap.get(item.code);

      if (!existing) {
        toInsert.push(item);
      } else if (existing.description !== item.description) {
        toUpdate.push(item);
      }
    }

    const toDelete = exist
      .filter((p) => !keepCodes.has(p.code))
      .map((p) => p.code);

    if (toDelete.length > 0) {
      await prisma.permissions.deleteMany({
        where: { code: { in: toDelete } },
      });
    }

    if (toInsert.length > 0) {
      await prisma.permissions.createMany({
        data: toInsert,
        skipDuplicates: true,
      });
    }

    for (const item of toUpdate) {
      await prisma.permissions.update({
        where: { code: item.code },
        data: { description: item.description },
      });
    }

    return {
      total: permissionList.length,
      inserted: toInsert.length,
      updated: toUpdate.length,
      deleted: toDelete.length,
      unchanged: permissionList.length - toInsert.length - toUpdate.length,
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
