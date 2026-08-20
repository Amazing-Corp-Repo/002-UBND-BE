import prisma from "../config/database.config.js";

const activeHoldingStatuses = [
  "PENDING",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETED",
];

const LeaderMeetingRegistrationRepository = {
  async createWithGuards({
    slotId,
    phoneNumber,
    citizenId,
    currentDate,
    currentTime,
    data,
    attachments,
  }) {
    return prisma.$transaction(async (tx) => {
      const slot = await tx.khung_gio_gap_lanh_dao.findFirst({
        where: {
          id: slotId,
          is_active: true,
          is_delete: false,
          lich_gap_lanh_dao: {
            is_active: true,
            is_delete: false,
            lanh_dao: { is_active: true, is_delete: false },
          },
        },
        include: {
          lich_gap_lanh_dao: {
            include: {
              lanh_dao: { select: { id: true, ho_va_ten: true } },
            },
          },
        },
      });
      if (!slot) return { conflict: "SLOT_UNAVAILABLE" };

      const appointmentDate = slot.lich_gap_lanh_dao.ngay;
      const appointmentDateText = appointmentDate.toISOString().slice(0, 10);
      if (
        appointmentDateText < currentDate ||
        (appointmentDateText === currentDate && slot.gio_bat_dau <= currentTime)
      ) {
        return { conflict: "SLOT_PASSED" };
      }
      const [heldCount, duplicatePhone, duplicateCitizen] = await Promise.all([
        tx.dang_ky_gap_lanh_dao.count({
          where: { id_khung_gio_gap: slotId, is_active: true, is_delete: false },
        }),
        tx.dang_ky_gap_lanh_dao.findFirst({
          where: {
            ngay_hen: appointmentDate,
            sdt: phoneNumber,
            trang_thai: { in: activeHoldingStatuses },
            is_active: true,
            is_delete: false,
          },
          select: { id: true },
        }),
        tx.dang_ky_gap_lanh_dao.findFirst({
          where: {
            ngay_hen: appointmentDate,
            cccd: citizenId,
            trang_thai: { in: activeHoldingStatuses },
            is_active: true,
            is_delete: false,
          },
          select: { id: true },
        }),
      ]);

      if (duplicatePhone) return { conflict: "PHONE_DAILY_LIMIT" };
      if (duplicateCitizen) return { conflict: "CITIZEN_DAILY_LIMIT" };
      if (heldCount >= slot.suc_chua) return { conflict: "SLOT_FULL" };

      const registration = await tx.dang_ky_gap_lanh_dao.create({
        data: {
          ...data,
          id_khung_gio_gap: slotId,
          ngay_hen: appointmentDate,
          dinh_kem_dang_ky_gap_lanh_dao:
            attachments.length > 0 ? { create: attachments } : undefined,
        },
      });

      return { registration, slot };
    }, { isolationLevel: "Serializable" });
  },

  async findForCitizenLookup({ registrationCode, phoneNumber }) {
    return prisma.dang_ky_gap_lanh_dao.findMany({
      where: {
        ...(registrationCode ? { ma_dang_ky: registrationCode } : {}),
        ...(phoneNumber ? { sdt: phoneNumber } : {}),
        is_active: true,
        is_delete: false,
      },
      orderBy: { thoi_gian_tao: "desc" },
      take: 50,
      select: {
        id: true,
        ma_dang_ky: true,
        ngay_hen: true,
        chu_de: true,
        ly_do: true,
        ho_ten: true,
        sdt: true,
        cccd: true,
        dia_chi: true,
        trang_thai: true,
        ly_do_tu_choi: true,
        thoi_gian_tu_choi: true,
        ly_do_huy: true,
        thoi_gian_huy: true,
        thoi_gian_phe_duyet: true,
        thoi_gian_bat_dau_xu_ly: true,
        thoi_gian_hoan_thanh: true,
        thoi_gian_tao: true,
        thoi_gian_cap_nhat: true,
        khung_gio_gap_lanh_dao: {
          select: {
            id: true,
            gio_bat_dau: true,
            gio_ket_thuc: true,
            lich_gap_lanh_dao: {
              select: {
                id: true,
                dia_diem: true,
                lanh_dao: { select: { id: true, ho_va_ten: true } },
              },
            },
          },
        },
        danh_gia_gap_lanh_dao: {
          select: { id: true },
        },
      },
    });
  },
};

export default LeaderMeetingRegistrationRepository;
