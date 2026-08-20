import LeaderMeetingScheduleRepository from "../repositories/leader-meeting-schedule.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";

const formatVietnamDate = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const formatVietnamTime = (date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const isPastSlot = (receptionDate, startTime, now) => {
  const date = formatVietnamDate(new Date(receptionDate));
  const today = formatVietnamDate(now);
  if (date !== today) return date < today;
  return startTime <= formatVietnamTime(now);
};

const mapSlot = (slot) => {
  const heldCount = slot.dang_ky_gap_lanh_dao.length;
  const remainingCapacity = Math.max(0, slot.suc_chua - heldCount);
  const isFull = remainingCapacity === 0;

  return {
    id: slot.id,
    startTime: slot.gio_bat_dau,
    endTime: slot.gio_ket_thuc,
    timeSlot: `${slot.gio_bat_dau} - ${slot.gio_ket_thuc}`,
    capacity: slot.suc_chua,
    heldCount,
    remainingCapacity,
    status: isFull ? "FULL" : "AVAILABLE",
    isFull,
  };
};

const mapManagementDetail = (schedule) => ({
  id: schedule.id,
  leader: {
    id: schedule.lanh_dao.id,
    fullName: schedule.lanh_dao.ho_va_ten,
    email: schedule.lanh_dao.email,
    phoneNumber: schedule.lanh_dao.so_dien_thoai,
  },
  receptionDate: formatVietnamDate(schedule.ngay),
  location: schedule.dia_diem,
  note: schedule.ghi_chu,
  isActive: schedule.is_active,
  slots: schedule.khung_gio_gap_lanh_dao.map((slot) => {
    const statusSummary = slot.dang_ky_gap_lanh_dao.reduce(
      (summary, registration) => {
        summary[registration.trang_thai] =
          (summary[registration.trang_thai] || 0) + 1;
        return summary;
      },
      {}
    );
    const heldCount = slot.dang_ky_gap_lanh_dao.length;
    return {
      id: slot.id,
      startTime: slot.gio_bat_dau,
      endTime: slot.gio_ket_thuc,
      timeSlot: `${slot.gio_bat_dau} - ${slot.gio_ket_thuc}`,
      capacity: slot.suc_chua,
      heldCount,
      remainingCapacity: Math.max(0, slot.suc_chua - heldCount),
      isActive: slot.is_active,
      statusSummary,
    };
  }),
  createdAt: schedule.thoi_gian_tao,
  updatedAt: schedule.thoi_gian_cap_nhat,
});

const validateSlots = (slots) => {
  const sortedSlots = [...slots].sort((left, right) =>
    left.startTime.localeCompare(right.startTime)
  );
  for (let index = 0; index < sortedSlots.length; index += 1) {
    const slot = sortedSlots[index];
    if (slot.startTime >= slot.endTime) {
      throw new BaseError(400, "Giờ bắt đầu phải trước giờ kết thúc");
    }
    if (index > 0 && slot.startTime < sortedSlots[index - 1].endTime) {
      throw new BaseError(400, "Các khung giờ gặp lãnh đạo không được chồng lấn");
    }
  }
  return sortedSlots;
};

const LeaderMeetingScheduleService = {
  async getAvailableSchedules(filters = {}) {
    const now = new Date();
    const fromDate = filters.fromDate || formatVietnamDate(now);
    const toDate = filters.toDate || formatVietnamDate(addDays(now, 90));

    if (fromDate > toDate) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }

    const schedules =
      await LeaderMeetingScheduleRepository.findAvailableBetweenDates({
        fromDate,
        toDate,
        leaderId: filters.leaderId,
      });

    return schedules
      .map((schedule) => ({
        id: schedule.id,
        leader: {
          id: schedule.lanh_dao.id,
          fullName: schedule.lanh_dao.ho_va_ten,
        },
        receptionDate: formatVietnamDate(schedule.ngay),
        location: schedule.dia_diem,
        note: schedule.ghi_chu,
        slots: schedule.khung_gio_gap_lanh_dao
          .filter(
            (slot) => !isPastSlot(schedule.ngay, slot.gio_bat_dau, now)
          )
          .map(mapSlot),
      }))
      .filter((schedule) => schedule.slots.length > 0);
  },

  async getManagementSchedules(filters, currentUser) {
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }

    const roles = currentUser.roles || [];
    const canViewAll = roles.some((role) =>
      ["ADMIN", "APPROVER", "PHE_DUYET"].includes(role)
    );
    const result = await LeaderMeetingScheduleRepository.findManagement({
      ...filters,
      leaderId: canViewAll ? undefined : currentUser.userId,
    });

    return {
      data: result.data.map((schedule) => {
        const registrations = schedule.khung_gio_gap_lanh_dao.flatMap(
          (slot) => slot.dang_ky_gap_lanh_dao
        );
        return {
          id: schedule.id,
          leader: {
            id: schedule.lanh_dao.id,
            fullName: schedule.lanh_dao.ho_va_ten,
          },
          receptionDate: formatVietnamDate(schedule.ngay),
          location: schedule.dia_diem,
          note: schedule.ghi_chu,
          isActive: schedule.is_active,
          slotCount: schedule.khung_gio_gap_lanh_dao.length,
          totalCapacity: schedule.khung_gio_gap_lanh_dao.reduce(
            (total, slot) => total + slot.suc_chua,
            0
          ),
          registrationCount: registrations.length,
          statusSummary: registrations.reduce((summary, registration) => {
            summary[registration.trang_thai] =
              (summary[registration.trang_thai] || 0) + 1;
            return summary;
          }, {}),
          createdAt: schedule.thoi_gian_tao,
          updatedAt: schedule.thoi_gian_cap_nhat,
        };
      }),
      pagination: createPagination(filters.page, filters.size, result.totalItems),
    };
  },

  async getManagementDetail(id, currentUser) {
    const roles = currentUser.roles || [];
    const canViewAll = roles.some((role) =>
      ["ADMIN", "APPROVER", "PHE_DUYET"].includes(role)
    );
    const schedule =
      await LeaderMeetingScheduleRepository.findManagementDetail(
        id,
        canViewAll ? undefined : currentUser.userId
      );
    if (!schedule) {
      throw new BaseError(404, "Lịch gặp lãnh đạo không tồn tại");
    }

    return mapManagementDetail(schedule);
  },

  async createManagementSchedule(input, currentUser) {
    const roles = currentUser.roles || [];
    if (!roles.some((role) => ["LANH_DAO", "LEADER"].includes(role))) {
      throw new BaseError(403, "Chỉ lãnh đạo được tự tạo lịch gặp công dân");
    }
    if (input.receptionDate < formatVietnamDate(new Date())) {
      throw new BaseError(400, "Không thể tạo lịch gặp lãnh đạo trong quá khứ");
    }

    const slots = validateSlots(input.slots);
    let created;
    try {
      created = await LeaderMeetingScheduleRepository.createManagement({
        leaderId: currentUser.userId,
        receptionDate: new Date(`${input.receptionDate}T00:00:00.000Z`),
        location: input.location || null,
        note: input.note || null,
        slots,
      });
    } catch (error) {
      if (error?.code === "P2002") {
        throw new BaseError(409, "Lãnh đạo đã có lịch trong ngày này");
      }
      throw error;
    }

    const schedule =
      await LeaderMeetingScheduleRepository.findManagementDetail(
        created.id,
        currentUser.userId
      );
    return mapManagementDetail(schedule);
  },

  async updateManagementSchedule(id, input, currentUser) {
    const roles = currentUser.roles || [];
    if (!roles.some((role) => ["LANH_DAO", "LEADER"].includes(role))) {
      throw new BaseError(403, "Chỉ lãnh đạo được sửa lịch gặp công dân của mình");
    }
    if (input.receptionDate < formatVietnamDate(new Date())) {
      throw new BaseError(400, "Không thể chuyển lịch gặp lãnh đạo về quá khứ");
    }
    const slots = validateSlots(input.slots);

    let result;
    try {
      result = await LeaderMeetingScheduleRepository.updateManagement(
        id,
        currentUser.userId,
        {
          receptionDate: new Date(`${input.receptionDate}T00:00:00.000Z`),
          location: input.location || null,
          note: input.note || null,
          slots,
        }
      );
    } catch (error) {
      if (error?.code === "P2002") {
        throw new BaseError(409, "Lãnh đạo đã có lịch khác trong ngày này");
      }
      throw error;
    }

    if (result.conflict === "NOT_FOUND") {
      throw new BaseError(404, "Lịch gặp lãnh đạo không tồn tại");
    }
    if (result.conflict === "HAS_REGISTRATIONS") {
      throw new BaseError(409, "Không được sửa lịch đã có đăng ký giữ chỗ");
    }

    const schedule =
      await LeaderMeetingScheduleRepository.findManagementDetail(
        id,
        currentUser.userId
      );
    return mapManagementDetail(schedule);
  },
};

export default LeaderMeetingScheduleService;
