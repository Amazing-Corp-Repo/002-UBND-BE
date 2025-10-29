import { getPostInstallTrigger } from "@prisma/client/scripts/postinstall.js";
import prisma from "../config/database.config.js";

const baseInclude = {
  uy_ban: {
    select: {
      id: true,
      ten_don_vi: true,
    },
  },
};

const CoSoDichVuCongRepository = {
  async findById(id) {
    return await prisma.co_so_dich_vu_cong.findFirst({
      where: {
        id,
      },
    });
  },

  async getAll({ is_removed, search }) {
    const where = {
      ...(is_removed !== undefined && is_removed !== ""
        ? { is_removed: is_removed === "true" }
        : {}),
      ...(search
        ? {
            OR: [{ ten_co_so: { contains: search, mode: "insensitive" } }],
          }
        : {}),
    };

    const items = await prisma.co_so_dich_vu_cong.findMany({
      where,
      include: baseInclude,
      orderBy: {
        thoi_gian_tao: "desc",
      },
    });
    return items;
  },

  async findByTenCoSo(ten_co_so) {
    return await prisma.co_so_dich_vu_cong.findFirst({
      where: {
        ten_co_so: ten_co_so,
      },
    });
  },


    async createCoSoDichVuCong(
    id_uy_ban,
    ten_co_so,
    dia_chi,
    so_dien_thoai,
    mo_ta,
    link_google_map
  ) {
    return await prisma.co_so_dich_vu_cong.create({
      data: {
        id_uy_ban,
        ten_co_so,
        dia_chi,
        so_dien_thoai,
        mo_ta,
        link_google_map
      },
    });
  },

  async findByTenCoSoId(ten_co_so, id, is_removed) {
    const where = {
      ...(is_removed !== undefined && is_removed !== ""
        ? { is_removed: is_removed === "true" }
        : {}),
      ...(search
        ? {
            OR: [[{ id: { contains: search, mode: "insensitive" } }]],
          }
        : {}),
    };
    const [id_co_so_dich_vu_cong] = await Promise.all([
      prisma.thu_tuc_hanh_chinh.findFirst({
        where,
        skip,
        take: size,
        orderBy: { thoi_gian_tao: "desc" },
      }),
      prisma.co_so_dich_vu_cong.count({ where }),
    ]);
    return { id_co_so_dich_vu_cong };
  },

  async updateCoSoDichVuCong(id, dataUpdate, nguoi_cap_nhap_id) {
    return await prisma.co_so_dich_vu_cong.update({
      where: { id },
      data: {
        ...dataUpdate,
        ...(nguoi_cap_nhap_id && {
          nguoi_dung_co_so_dich_vu_cong_nguoi_cap_nhapTonguoi_dung: {
            connect: { id: nguoi_cap_nhap_id },
          },
        }),
        thoi_gian_cap_nhap: new Date(),
      },
    });
  },

  async deleteCoSoDichVuCong(id, nguoi_cap_nhap_id) {
    return await prisma.co_so_dich_vu_cong.update({
      where: { id },
      data: {
        is_removed: true,
        ...(nguoi_cap_nhap_id && {
          nguoi_dung_co_so_dich_vu_cong_nguoi_cap_nhapTonguoi_dung: {
            connect: { id: nguoi_cap_nhap_id },
          },
        }),
        thoi_gian_cap_nhap: new Date(),
      },
    });
  },
};

export default CoSoDichVuCongRepository;
