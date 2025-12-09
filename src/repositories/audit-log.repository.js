import prisma from "../config/database.config.js";

const AuditLogRepository = {
  async getAllAuditLogs(page, size, from, to, search) {
    const skip = (page - 1) * size;
    const where = {
      timestamp: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      },
      ...(search && {
        OR: [
          {
            nguoi_dung: {
              ho_va_ten: { contains: search, mode: "insensitive" },
            },
          },
        ],
      }),
    };
    let [total, logs] = await Promise.all([
      prisma.audit_logs.count({ where }),
      prisma.audit_logs.findMany({
        select: {
          id: true,
          action: true,
          duration_ms: true,
          remote_address: true,
          table_name: true,
          timestamp: true,
          nguoi_dung: {
            select: {
              ho_va_ten: true,
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
          },
        },
        skip: skip,
        take: size,
        orderBy: {
          timestamp: "desc",
        },
        where,
      }),
    ]);
    return { total, logs };
  },

  async getAuditLogById(id) {
    return await prisma.audit_logs.findUnique({
      where: { id: id },
      select: {
        id: true,
        action: true,
        duration_ms: true,
        remote_address: true,
        table_name: true,
        timestamp: true,
        request_body: true,
        response_body: true,
        username: true,
        response_status_code: true,
        nguoi_dung: {
          select: {
            ho_va_ten: true,
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
        },
      },
    });
  },
};

export default AuditLogRepository;
