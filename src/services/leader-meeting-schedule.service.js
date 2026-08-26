import LeaderMeetingScheduleRepository from "../repositories/leader-meeting-schedule.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { normalizeRoleNames } from "../utils/auth-context.util.js";
import {
  DEFAULT_LEADER_MEETING_LOCATION,
  DEFAULT_LEADER_MEETING_NOTE,
  LEADER_MEETING_PERIODS,
  LEADER_MEETING_SLOT_CAPACITY,
  LEADER_MEETING_SLOT_DURATION_MINUTES,
  LEADER_MEETING_STANDARD_SLOT_KEYS,
  leaderMeetingSlotKey,
} from "../constants/leader-meeting-schedule.constant.js";

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

const ensureLeaderRole = (currentUser, message) => {
  const roles = normalizeRoleNames(currentUser.roles);
  if (!roles.some((role) => ["LANH_DAO", "LEADER"].includes(role))) {
    throw new BaseError(403, message);
  }
};

const validateStandardSlots = (slots) => {
  const uniqueKeys = new Set();
  for (const slot of slots) {
    const key = leaderMeetingSlotKey(slot.startTime, slot.endTime);
    if (!LEADER_MEETING_STANDARD_SLOT_KEYS.has(key)) {
      throw new BaseError(
        400,
        "Ca tiếp công dân phải thuộc 15 ca cố định, mỗi ca kéo dài 30 phút"
      );
    }
    if (uniqueKeys.has(key)) {
      throw new BaseError(400, "Danh sách ca tiếp công dân không được trùng");
    }
    uniqueKeys.add(key);
  }
  return validateSlots(slots);
};

const formatVietnamWeekday = (date) => {
  const weekday = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
  }).format(date);
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`;
};

const buildDailyManagementView = ({ schedule, leader, receptionDate, now }) => {
  const scheduleIsActive = Boolean(
    schedule && schedule.is_active && !schedule.is_delete
  );
  const slotsByKey = new Map(
    (schedule?.khung_gio_gap_lanh_dao || []).map((slot) => [
      leaderMeetingSlotKey(slot.gio_bat_dau, slot.gio_ket_thuc),
      slot,
    ])
  );

  const periods = LEADER_MEETING_PERIODS.map((period) => {
    const slots = period.slots.map((definition) => {
      const stored = slotsByKey.get(
        leaderMeetingSlotKey(definition.startTime, definition.endTime)
      );
      const heldCount = stored?.dang_ky_gap_lanh_dao?.length || 0;
      const isOpen = Boolean(
        scheduleIsActive && stored?.is_active && !stored?.is_delete
      );
      const isPast = isPastSlot(
        new Date(`${receptionDate}T00:00:00.000Z`),
        definition.startTime,
        now
      );
      const canToggle = !isPast && (!isOpen || heldCount === 0);

      return {
        id: stored?.id || null,
        startTime: definition.startTime,
        endTime: definition.endTime,
        durationMinutes: LEADER_MEETING_SLOT_DURATION_MINUTES,
        isOpen,
        capacity: LEADER_MEETING_SLOT_CAPACITY,
        heldCount,
        remainingCapacity: isOpen
          ? Math.max(0, LEADER_MEETING_SLOT_CAPACITY - heldCount)
          : 0,
        canToggle,
        blockedReason: isPast
          ? "Ca tiếp công dân đã qua"
          : isOpen && heldCount > 0
            ? "Ca đã có công dân đăng ký giữ chỗ"
            : null,
      };
    });
    return {
      code: period.code,
      name: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      totalSlots: slots.length,
      openSlots: slots.filter((slot) => slot.isOpen).length,
      slots,
    };
  });
  const openSlots = periods.reduce(
    (total, period) => total + period.openSlots,
    0
  );

  return {
    id: scheduleIsActive ? schedule.id : null,
    receptionDate,
    dayOfWeek: formatVietnamWeekday(
      new Date(`${receptionDate}T00:00:00.000Z`)
    ),
    leader: {
      id: leader?.id || schedule?.lanh_dao?.id || null,
      fullName: leader?.ho_va_ten || schedule?.lanh_dao?.ho_va_ten || null,
    },
    location: scheduleIsActive
      ? schedule.dia_diem || DEFAULT_LEADER_MEETING_LOCATION
      : DEFAULT_LEADER_MEETING_LOCATION,
    note: scheduleIsActive
      ? schedule.ghi_chu || DEFAULT_LEADER_MEETING_NOTE
      : DEFAULT_LEADER_MEETING_NOTE,
    summary: {
      totalSlots: LEADER_MEETING_PERIODS.reduce(
        (total, period) => total + period.slots.length,
        0
      ),
      openSlots,
      morningOpenSlots:
        periods.find((period) => period.code === "MORNING")?.openSlots || 0,
      afternoonOpenSlots:
        periods.find((period) => period.code === "AFTERNOON")?.openSlots || 0,
    },
    periods,
  };
};

const LeaderMeetingScheduleService = {
  async getAvailableSchedules(filters = {}) {
    const now = new Date();
    const visibilityWindow = {
      fromDate: formatVietnamDate(now),
      toDate: formatVietnamDate(addDays(now, 6)),
    };
    const requestedFromDate = filters.fromDate || visibilityWindow.fromDate;
    const requestedToDate = filters.toDate || visibilityWindow.toDate;

    if (requestedFromDate > requestedToDate) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }

    const fromDate =
      requestedFromDate < visibilityWindow.fromDate
        ? visibilityWindow.fromDate
        : requestedFromDate;
    const toDate =
      requestedToDate > visibilityWindow.toDate
        ? visibilityWindow.toDate
        : requestedToDate;

    if (fromDate > toDate) return [];

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

    if (filters.date) {
      ensureLeaderRole(
        currentUser,
        "Chỉ lãnh đạo được xem bảng ca tiếp công dân của mình"
      );
      const receptionDate = new Date(`${filters.date}T00:00:00.000Z`);
      const [schedule, leader] = await Promise.all([
        LeaderMeetingScheduleRepository.findDailySchedule(
          currentUser.userId,
          receptionDate
        ),
        LeaderMeetingScheduleRepository.findLeaderIdentity(currentUser.userId),
      ]);
      return {
        dailyView: true,
        data: buildDailyManagementView({
          schedule,
          leader,
          receptionDate: filters.date,
          now: new Date(),
        }),
      };
    }

    const roles = normalizeRoleNames(currentUser.roles);
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
    const roles = normalizeRoleNames(currentUser.roles);
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
    ensureLeaderRole(
      currentUser,
      "Chỉ lãnh đạo được tự tạo lịch gặp công dân"
    );
    if (input.receptionDate < formatVietnamDate(new Date())) {
      throw new BaseError(400, "Không thể tạo lịch gặp lãnh đạo trong quá khứ");
    }

    const usesDailyGrid = Array.isArray(input.openSlots);
    const slots = usesDailyGrid
      ? validateStandardSlots(input.openSlots)
      : validateSlots(input.slots);
    if (slots.some((slot) => isPastSlot(
      new Date(`${input.receptionDate}T00:00:00.000Z`),
      slot.startTime,
      new Date()
    ))) {
      throw new BaseError(400, "Không thể mở ca tiếp công dân đã qua");
    }
    let created;
    try {
      created = await LeaderMeetingScheduleRepository.createManagement({
        leaderId: currentUser.userId,
        receptionDate: new Date(`${input.receptionDate}T00:00:00.000Z`),
        location:
          input.location ||
          (usesDailyGrid ? DEFAULT_LEADER_MEETING_LOCATION : null),
        note:
          input.note || (usesDailyGrid ? DEFAULT_LEADER_MEETING_NOTE : null),
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
    ensureLeaderRole(
      currentUser,
      "Chỉ lãnh đạo được sửa lịch gặp công dân của mình"
    );
    if (input.receptionDate < formatVietnamDate(new Date())) {
      throw new BaseError(400, "Không thể chuyển lịch gặp lãnh đạo về quá khứ");
    }
    const usesDailyGrid = Array.isArray(input.openSlots);
    const slots = usesDailyGrid
      ? validateStandardSlots(input.openSlots)
      : validateSlots(input.slots);
    if (usesDailyGrid && slots.some((slot) => isPastSlot(
      new Date(`${input.receptionDate}T00:00:00.000Z`),
      slot.startTime,
      new Date()
    ))) {
      throw new BaseError(400, "Không thể mở ca tiếp công dân đã qua");
    }

    let result;
    try {
      result = await LeaderMeetingScheduleRepository.updateManagement(
        id,
        currentUser.userId,
        {
          receptionDate: new Date(`${input.receptionDate}T00:00:00.000Z`),
          location:
            input.location ||
            (usesDailyGrid ? DEFAULT_LEADER_MEETING_LOCATION : null),
          note:
            input.note || (usesDailyGrid ? DEFAULT_LEADER_MEETING_NOTE : null),
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

  async updateManagementStatus(id, isActive, currentUser) {
    const roles = normalizeRoleNames(currentUser.roles);
    if (!roles.some((role) => ["LANH_DAO", "LEADER"].includes(role))) {
      throw new BaseError(403, "Chỉ lãnh đạo được cập nhật trạng thái lịch của mình");
    }
    const result =
      await LeaderMeetingScheduleRepository.updateManagementStatus(
        id,
        currentUser.userId,
        isActive
      );
    if (result.conflict === "NOT_FOUND") {
      throw new BaseError(404, "Lịch gặp lãnh đạo không tồn tại");
    }
    if (result.conflict === "HAS_REGISTRATIONS") {
      throw new BaseError(
        409,
        "Không được thay đổi trạng thái lịch đã có đăng ký giữ chỗ"
      );
    }

    const schedule =
      await LeaderMeetingScheduleRepository.findManagementDetail(
        id,
        currentUser.userId
      );
    return mapManagementDetail(schedule);
  },

  async updateDailySlotStatus(input, currentUser) {
    ensureLeaderRole(
      currentUser,
      "Chỉ lãnh đạo được mở hoặc đóng ca tiếp công dân của mình"
    );
    validateStandardSlots([input]);

    const receptionDate = new Date(`${input.receptionDate}T00:00:00.000Z`);
    if (isPastSlot(receptionDate, input.startTime, new Date())) {
      throw new BaseError(400, "Không thể thay đổi ca tiếp công dân đã qua");
    }

    const result = await LeaderMeetingScheduleRepository.updateDailySlotStatus({
      leaderId: currentUser.userId,
      receptionDate,
      startTime: input.startTime,
      endTime: input.endTime,
      isOpen: input.isOpen,
      location: DEFAULT_LEADER_MEETING_LOCATION,
      note: DEFAULT_LEADER_MEETING_NOTE,
    });
    if (result.conflict === "HAS_REGISTRATIONS") {
      throw new BaseError(
        409,
        "Không được đóng ca đã có công dân đăng ký giữ chỗ"
      );
    }

    const [schedule, leader] = await Promise.all([
      LeaderMeetingScheduleRepository.findDailySchedule(
        currentUser.userId,
        receptionDate
      ),
      LeaderMeetingScheduleRepository.findLeaderIdentity(currentUser.userId),
    ]);
    return buildDailyManagementView({
      schedule,
      leader,
      receptionDate: input.receptionDate,
      now: new Date(),
    });
  },

  async deleteManagementSchedule(id, currentUser) {
    const roles = normalizeRoleNames(currentUser.roles);
    if (!roles.some((role) => ["LANH_DAO", "LEADER"].includes(role))) {
      throw new BaseError(403, "Chỉ lãnh đạo được xóa lịch gặp công dân của mình");
    }
    const result = await LeaderMeetingScheduleRepository.deleteManagement(
      id,
      currentUser.userId
    );
    if (result.conflict === "NOT_FOUND") {
      throw new BaseError(404, "Lịch gặp lãnh đạo không tồn tại");
    }
    if (result.conflict === "HAS_REGISTRATIONS") {
      throw new BaseError(409, "Không được xóa lịch đã có đăng ký giữ chỗ");
    }
    return { id, deleted: true };
  },
};

export default LeaderMeetingScheduleService;
