import prisma from "../config/database.config.js";
import PHAN_ANH_EXTENSION_STATUS from "../constants/phan-anh-extension-status.constant.js";
import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";

const extensionInclude = {
  phan_anh: {
    include: {
      linh_vuc_phan_anh: { select: { id: true, ten: true } },
      to_phu_trach: { select: { id: true, ho_va_ten: true, email: true } },
      lich_su_trang_thai: {
        where: { ten: { not: PHAN_ANH_STATUS.DA_GIA_HAN } },
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

const buildExtensionWhere = ({ status, search, mucDo, idLinhVuc, scopedLinhVucIds }) => {
  const complaintFilters = [
    ...(Array.isArray(scopedLinhVucIds)
      ? [{ id_linh_vuc_phan_anh: { in: scopedLinhVucIds } }]
      : []),
    ...(idLinhVuc ? [{ id_linh_vuc_phan_anh: idLinhVuc }] : []),
    ...(mucDo ? [{ muc_do: mucDo }] : []),
  ];

  return {
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
};

const PhanAnhExtensionRepository = {
  async findComplaintById(idPhanAnh) {
    return prisma.phan_anh.findUnique({
      where: { id: idPhanAnh },
      include: {
        lich_su_trang_thai: {
          where: { ten: { not: PHAN_ANH_STATUS.DA_GIA_HAN } },
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

      const created = await tx.de_nghi_gia_han_phan_anh.create({
        data: {
          ...data,
          ...(files.length > 0
            ? { de_nghi_gia_han_file: { create: files } }
            : {}),
        },
        include: extensionInclude,
      });

      const hanMoiDate = new Date(data.han_de_xuat_moi);
      const formattedHanMoi = isNaN(hanMoiDate.getTime())
        ? ""
        : new Intl.DateTimeFormat("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(hanMoiDate);

      const latestHistory = await tx.lich_su_trang_thai.findFirst({
        where: { id_phan_anh: data.id_phan_anh },
        orderBy: { thoi_gian_tao: "desc" },
        select: { thoi_gian_tao: true },
      });
      const now = new Date();
      let statusTime = now;
      if (latestHistory?.thoi_gian_tao && new Date(latestHistory.thoi_gian_tao).getTime() >= now.getTime()) {
        statusTime = new Date(new Date(latestHistory.thoi_gian_tao).getTime() + 1000);
      }

      await tx.lich_su_trang_thai.create({
        data: {
          id_phan_anh: data.id_phan_anh,
          ten: PHAN_ANH_STATUS.XIN_GIA_HAN,
          ghi_chu: `Lý do xin gia hạn: ${data.ly_do_gia_han}${formattedHanMoi ? `. Hạn đề xuất mới: ${formattedHanMoi}` : ""}`,
          nguoi_tao: data.id_nguoi_de_nghi,
          thoi_gian_tao: statusTime,
        },
      });

      return created;
    });
  },

  async getList({ status, page, size, search, mucDo, idLinhVuc, scopedLinhVucIds }) {
    const skip = (page - 1) * size;
    const where = buildExtensionWhere({ status, search, mucDo, idLinhVuc, scopedLinhVucIds });
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

  async getAllForExport({ status, search, mucDo, idLinhVuc, scopedLinhVucIds }) {
    return prisma.de_nghi_gia_han_phan_anh.findMany({
      where: buildExtensionWhere({ status, search, mucDo, idLinhVuc, scopedLinhVucIds }),
      include: extensionInclude,
      orderBy: { thoi_gian_tao: "desc" },
    });
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
      const hanMoiDate = new Date(extension.han_de_xuat_moi);
      const formattedHanMoi = isNaN(hanMoiDate.getTime())
        ? ""
        : new Intl.DateTimeFormat("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(hanMoiDate);

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

      const latestHistory = await tx.lich_su_trang_thai.findFirst({
        where: { id_phan_anh: extension.id_phan_anh },
        orderBy: { thoi_gian_tao: "desc" },
        select: { thoi_gian_tao: true },
      });
      let approveTime = now;
      if (latestHistory?.thoi_gian_tao && new Date(latestHistory.thoi_gian_tao).getTime() >= now.getTime()) {
        approveTime = new Date(new Date(latestHistory.thoi_gian_tao).getTime() + 1000);
      }
      const resumeTime = new Date(approveTime.getTime() + 1000);

      // Mốc "Đã gia hạn" kèm ý kiến Lãnh đạo
      await tx.lich_su_trang_thai.create({
        data: {
          id_phan_anh: extension.id_phan_anh,
          ten: PHAN_ANH_STATUS.DA_GIA_HAN,
          ghi_chu: ghiChu
            ? `Lãnh đạo đã phê duyệt gia hạn đến ${formattedHanMoi}. Ý kiến: ${ghiChu}`
            : `Lãnh đạo đã phê duyệt gia hạn đến ${formattedHanMoi}`,
          nguoi_tao: userId,
          thoi_gian_tao: approveTime,
        },
      });

      // Tự động chuyển tiếp sang "Đang xử lý" theo hạn mới
      await tx.lich_su_trang_thai.create({
        data: {
          id_phan_anh: extension.id_phan_anh,
          ten: PHAN_ANH_STATUS.DANG_XU_LY,
          ghi_chu: `Tiếp tục xử lý phản ánh theo thời hạn mới`,
          nguoi_tao: userId,
          thoi_gian_tao: resumeTime,
        },
      });

      return { complaintCode: extension.phan_anh.ma_phan_anh };
    });
  },

  async reject(id, userId, lyDoTuChoi) {
    return prisma.$transaction(async (tx) => {
      const extension = await tx.de_nghi_gia_han_phan_anh.findUnique({
        where: { id },
        include: {
          phan_anh: {
            select: {
              id: true,
              ma_phan_anh: true,
              nguoi_tao: true,
              id_linh_vuc_phan_anh: true,
              tieu_de: true,
              mo_ta: true,
            },
          },
        },
      });
      if (!extension || extension.trang_thai !== PHAN_ANH_EXTENSION_STATUS.PENDING) return null;

      const now = new Date();
      const updateResult = await tx.de_nghi_gia_han_phan_anh.updateMany({
        where: { id, trang_thai: PHAN_ANH_EXTENSION_STATUS.PENDING },
        data: {
          trang_thai: PHAN_ANH_EXTENSION_STATUS.REJECTED,
          id_nguoi_duyet: userId,
          ly_do_tu_choi: lyDoTuChoi,
          thoi_gian_duyet: now,
        },
      });
      if (updateResult.count !== 1) return null;

      await tx.phan_anh.update({
        where: { id: extension.id_phan_anh },
        data: {
          nguoi_cap_nhat: userId,
          thoi_gian_cap_nhat: now,
        },
      });

      const latestHistory = await tx.lich_su_trang_thai.findFirst({
        where: { id_phan_anh: extension.id_phan_anh },
        orderBy: { thoi_gian_tao: "desc" },
        select: { thoi_gian_tao: true },
      });
      let rejectTime = now;
      if (latestHistory?.thoi_gian_tao && new Date(latestHistory.thoi_gian_tao).getTime() >= now.getTime()) {
        rejectTime = new Date(new Date(latestHistory.thoi_gian_tao).getTime() + 1000);
      }

      await tx.lich_su_trang_thai.create({
        data: {
          id_phan_anh: extension.id_phan_anh,
          ten: PHAN_ANH_STATUS.DONG,
          ghi_chu: lyDoTuChoi ? `Lãnh đạo từ chối gia hạn. Lý do: ${lyDoTuChoi}` : "Lãnh đạo từ chối gia hạn phản ánh",
          nguoi_tao: userId,
          thoi_gian_tao: rejectTime,
        },
      });

      return {
        complaintCode: extension.phan_anh.ma_phan_anh,
        complaint: extension.phan_anh,
      };
    });
  },
};

export default PhanAnhExtensionRepository;
