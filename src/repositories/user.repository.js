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
    const where = {
      ...(isActive !== undefined && isActive !== ""
        ? { is_active: isActive === "true" }
        : {}),
      is_delete: false,
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
    const skip = (page - 1) * size;
    const [users, total] = await Promise.all([
      prisma.nguoi_dung.findMany({
        skip,
        take: size,
        where: {
          ...where,
          is_delete: false,
          ...(role
            ? {
                user_roles: {
                  some: {
                    role_id: role,
                  },
                },
              }
            : {}),
        },
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
      prisma.nguoi_dung.count({ where }),
    ]);

    return { users, total };
  },

  async findByUsernameOrEmail(ten_dang_nhap, email) {
    return await prisma.nguoi_dung.findFirst({
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
};

export default UserRepository;
