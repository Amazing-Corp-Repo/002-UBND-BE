import { randomInt } from "node:crypto";
import { TIEP_DAN_STATUS, TIEP_DAN_TYPE } from "../constants/tiep-dan.constant.js";
import DangKyTiepDanRepository from "../repositories/dang-ky-tiep-dan.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { buildHourlySlots } from "./reception-schedule.service.js";
import {
  DEFAULT_RECEPTION_COUNTER_CAPACITY,
  RECEPTION_COUNTER_CODES,
} from "../constants/reception-schedule.constant.js";
import UserRepository from "../repositories/user.repository.js";

const MAX_CODE_RETRIES = 10;

const createShortReceptionCode = () => {
  const letter = String.fromCharCode(65 + randomInt(0, 26));
  return `${letter}${String(randomInt(0, 100000)).padStart(5, "0")}`;
};

const getVietnamDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const getVietnamTime = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());

const isUniqueConstraintError = (error) => error?.code === "P2002";
const isSerializableConflict = (error) => error?.code === "P2034";

const REGISTRATION_CONFLICTS = {
  SCHEDULE_UNAVAILABLE: [404, "Lịch tiếp dân không tồn tại hoặc đã ngừng hoạt động"],
  SLOT_NOT_FOUND: [404, "Khung giờ tiếp dân không tồn tại hoặc không thuộc lịch đã chọn"],
  INVALID_SLOT: [400, "Khung giờ không thuộc lịch tiếp dân đã chọn"],
  DUPLICATE_SLOT_PHONE: [409, "Số điện thoại đã đăng ký khung giờ này"],
  PHONE_DAILY_LIMIT: [409, "Số điện thoại chỉ được đăng ký tối đa 2 đơn trong một ngày"],
  CITIZEN_DAILY_LIMIT: [409, "CCCD chỉ được đăng ký tối đa 2 đơn trong một ngày"],
  SLOT_FULL: [409, "Khung giờ tiếp dân đã đủ sức chứa"],
};

const maskValue = (value, visibleSuffix = 4) => {
  if (!value) return null;
  const suffix = value.slice(-visibleSuffix);
  return `${"*".repeat(Math.max(0, value.length - visibleSuffix))}${suffix}`;
};

const mapCitizenRegistration = (item) => ({
  id: item.id,
  receptionCode: item.ma_tiep_dan,
  receptionType: item.loai,
  receptionDate: item.ngay,
  timeSlot: item.slot,
  topic: item.chu_de,
  description: item.ly_do,
  fullName: item.ho_ten,
  phoneNumber: maskValue(item.sdt, 4),
  citizenId: maskValue(item.cccd, 4),
  address: item.dia_chi,
  department: item.bo_phan,
  leaderName: item.ten_lanh_dao,
  leaderTitle: item.chuc_vu_lanh_dao,
  status: item.trang_thai,
  rejectionReason: item.ly_do_tu_choi || null,
  rejectedAt: item.thoi_gian_tu_choi || null,
  createdAt: item.thoi_gian_tao,
  updatedAt: item.thoi_gian_cap_nhat,
});

const mapStaffRegistration = (item) => ({
  id: item.id,
  receptionCode: item.ma_tiep_dan,
  applicantName: item.ho_ten,
  phoneNumber: item.sdt,
  receptionDate: item.ngay,
  timeSlot: item.slot,
  topic: item.chu_de,
  workingContent: item.ly_do,
  department: item.bo_phan,
  approvalStatus: item.trang_thai,
  ratingStatus:
    item.danh_gia_tiep_dan?.length > 0 ? "RATED" : "NOT_RATED",
  approverName: item.ten_lanh_dao,
  approvedAt:
    item.thoi_gian_phe_duyet ||
    (item.trang_thai === TIEP_DAN_STATUS.APPROVED
      ? item.thoi_gian_cap_nhat
      : null),
  completedAt: item.thoi_gian_hoan_thanh || null,
  rejectionReason: item.ly_do_tu_choi || null,
  rejectedAt: item.thoi_gian_tu_choi || null,
});

const mapStaffRegistrationDetail = (item) => {
  const rating = item.danh_gia_tiep_dan?.[0] || null;
  return {
    id: item.id,
    receptionCode: item.ma_tiep_dan,
    receptionType: item.loai,
    schedule: item.lich_tiep_dan
      ? {
          id: item.lich_tiep_dan.id,
          officerName: item.lich_tiep_dan.ten_can_bo,
          location: item.lich_tiep_dan.dia_diem,
          receptionDate: item.lich_tiep_dan.ngay_tiep_dan,
          timeRange: item.lich_tiep_dan.thoi_gian,
          note: item.lich_tiep_dan.ghi_chu,
        }
      : null,
    receptionDate: item.ngay,
    timeSlot: item.slot,
    topic: item.chu_de,
    workingContent: item.ly_do,
    applicant: {
      fullName: item.ho_ten,
      phoneNumber: item.sdt,
      citizenId: item.cccd,
      address: item.dia_chi,
    },
    department: item.bo_phan,
    approvalStatus: item.trang_thai,
    approver: item.ten_lanh_dao
      ? {
          name: item.ten_lanh_dao,
          title: item.chuc_vu_lanh_dao,
          approvedAt: item.thoi_gian_phe_duyet || item.thoi_gian_cap_nhat,
        }
      : null,
    ratingStatus: rating ? "RATED" : "NOT_RATED",
    completedAt: item.thoi_gian_hoan_thanh || null,
    rejectionReason: item.ly_do_tu_choi || null,
    rejectedAt: item.thoi_gian_tu_choi || null,
    rating: rating
      ? {
          id: rating.id,
          score: rating.diem_tong,
          suggestions: rating.ly_do,
          comment: rating.nhan_xet,
          createdAt: rating.thoi_gian_tao,
        }
      : null,
    createdAt: item.thoi_gian_tao,
    updatedAt: item.thoi_gian_cap_nhat,
  };
};

const mapRatingLookup = (item) => ({
  registrationId: item.id,
  receptionCode: item.ma_tiep_dan,
  receptionDate: item.ngay,
  timeSlot: item.slot,
  topic: item.chu_de,
  workingContent: item.ly_do,
  applicant: {
    fullName: item.ho_ten,
    phoneNumber: maskValue(item.sdt, 4),
    citizenId: maskValue(item.cccd, 4),
    address: item.dia_chi,
  },
  department: item.bo_phan,
  approvalStatus: item.trang_thai,
  ratingStatus: "NOT_RATED",
});

const DangKyTiepDanService = {
  async createCounterReception(input) {
    const schedule = await DangKyTiepDanRepository.findScheduleById(
      input.idLichTiepDan
    );

    if (!schedule || !schedule.ngay_tiep_dan) {
      throw new BaseError(404, "Lịch tiếp dân không tồn tại hoặc đã ngừng hoạt động");
    }

    const scheduleDate = new Date(schedule.ngay_tiep_dan)
      .toISOString()
      .slice(0, 10);
    if (scheduleDate < getVietnamDate()) {
      throw new BaseError(400, "Không thể đăng ký lịch tiếp dân đã qua");
    }

    const configuredSlots = schedule.khung_gio_tiep_dan || [];
    const selectedSlot = input.slotId
      ? configuredSlots.find((slot) => slot.id === input.slotId)
      : null;
    if (input.slotId && !selectedSlot) {
      throw new BaseError(
        404,
        "Khung giờ tiếp dân không tồn tại hoặc không thuộc lịch đã chọn"
      );
    }
    if (selectedSlot && input.slot && selectedSlot.khung_gio !== input.slot) {
      throw new BaseError(400, "Khung giờ không thuộc lịch tiếp dân đã chọn");
    }
    const resolvedSlot = selectedSlot?.khung_gio || input.slot;
    const matchingSlots = configuredSlots.filter(
      (slot) => slot.khung_gio === resolvedSlot
    );
    const legacySlots = configuredSlots.length === 0
      ? (schedule.thoi_gian || "")
          .split(",")
          .flatMap((period) => buildHourlySlots(period.trim()))
      : [];
    if (matchingSlots.length === 0 && !legacySlots.includes(resolvedSlot)) {
      throw new BaseError(400, "Khung giờ không thuộc lịch tiếp dân đã chọn");
    }
    const slotStartTime = resolvedSlot.split("-")[0].trim();
    if (
      scheduleDate === getVietnamDate() &&
      slotStartTime <= getVietnamTime()
    ) {
      throw new BaseError(409, "Khung giờ tiếp dân đã qua");
    }
    const resolvedSlotId = selectedSlot?.id || matchingSlots[0]?.id || null;
    const totalCapacity = matchingSlots.length > 0
      ? matchingSlots.reduce((total, slot) => total + slot.suc_chua, 0)
      : RECEPTION_COUNTER_CODES.length * DEFAULT_RECEPTION_COUNTER_CAPACITY;

    const data = {
      loai: TIEP_DAN_TYPE.COUNTER_RECEPTION,
      id_lich_tiep_dan: input.idLichTiepDan,
      slot: resolvedSlot,
      chu_de: input.chuDe,
      ly_do: input.lyDo,
      ho_ten: input.hoTen,
      sdt: input.sdt,
      cccd: input.cccd,
      dia_chi: input.diaChi,
      trang_thai: TIEP_DAN_STATUS.PENDING,
    };

    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt += 1) {
      try {
        const result = await DangKyTiepDanRepository.createWithGuards({
          scheduleId: input.idLichTiepDan,
          slotId: input.slotId,
          slot: resolvedSlot,
          phoneNumber: input.sdt,
          citizenId: input.cccd,
          totalCapacity,
          data: {
            ...data,
            ma_tiep_dan: createShortReceptionCode(),
          },
        });
        if (result.conflict) {
          const [statusCode, message] = REGISTRATION_CONFLICTS[result.conflict];
          throw new BaseError(statusCode, message);
        }
        return {
          ...result.registration,
          slotId: resolvedSlotId,
        };
      } catch (error) {
        const retryable =
          isUniqueConstraintError(error) || isSerializableConflict(error);
        if (!retryable || attempt === MAX_CODE_RETRIES - 1) {
          throw error;
        }
      }
    }

    throw new BaseError(500, "Không thể tạo mã tiếp dân");
  },

  async lookupForCitizen(input) {
    const registrations = await DangKyTiepDanRepository.findForCitizenLookup({
      receptionCode: input.receptionCode?.toUpperCase(),
      phoneNumber: input.phoneNumber,
    });

    if (registrations.length === 0) {
      throw new BaseError(404, "Không tìm thấy đăng ký tiếp dân");
    }

    return registrations.map(mapCitizenRegistration);
  },

  async getAllForStaff(filters) {
    const normalizedFilters = {
      ...filters,
      receptionDate: filters.receptionDate
        ? new Date(filters.receptionDate).toISOString().slice(0, 10)
        : undefined,
    };
    const { data, totalItems } =
      await DangKyTiepDanRepository.findAllForStaff(normalizedFilters);

    return {
      data: data.map(mapStaffRegistration),
      pagination: createPagination(filters.page, filters.size, totalItems),
    };
  },

  async getDetailForStaff(id) {
    const registration = await DangKyTiepDanRepository.findDetailById(id);
    if (!registration) {
      throw new BaseError(404, "Đăng ký tiếp dân không tồn tại");
    }
    return mapStaffRegistrationDetail(registration);
  },

  async approve(id, department, currentUser) {
    const registration = await DangKyTiepDanRepository.findActiveById(id);
    if (!registration) {
      throw new BaseError(404, "Đăng ký tiếp dân không tồn tại");
    }
    if (registration.trang_thai !== TIEP_DAN_STATUS.PENDING) {
      throw new BaseError(409, "Chỉ đăng ký đang chờ mới được phê duyệt");
    }

    const approver = await UserRepository.findById(currentUser.userId);
    if (!approver) {
      throw new BaseError(404, "Không tìm thấy người phê duyệt");
    }
    const approverTitle = approver.user_roles?.[0]?.roles?.name || null;

    let result;
    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt += 1) {
      try {
        result = await DangKyTiepDanRepository.approvePendingWithCounterGuard(
          id,
          department,
          {
            bo_phan: department,
            trang_thai: TIEP_DAN_STATUS.APPROVED,
            ten_lanh_dao: approver.ho_va_ten || currentUser.username,
            chuc_vu_lanh_dao: approverTitle,
            nguoi_cap_nhat: currentUser.userId,
            thoi_gian_cap_nhat: new Date().toISOString(),
            thoi_gian_phe_duyet: new Date().toISOString(),
          }
        );
        break;
      } catch (error) {
        if (!isSerializableConflict(error) || attempt === MAX_CODE_RETRIES - 1) {
          throw error;
        }
      }
    }
    if (result?.conflict === "COUNTER_FULL") {
      throw new BaseError(409, "Quầy tiếp nhận đã đủ sức chứa trong ca này");
    }
    if (result?.conflict === "ALREADY_PROCESSED" || !result?.registration) {
      throw new BaseError(409, "Đăng ký đã được xử lý bởi người khác");
    }

    return mapStaffRegistrationDetail(result.registration);
  },

  async complete(id, currentUser) {
    const registration = await DangKyTiepDanRepository.findActiveById(id);
    if (!registration) {
      throw new BaseError(404, "Đăng ký tiếp dân không tồn tại");
    }
    if (registration.trang_thai !== TIEP_DAN_STATUS.APPROVED) {
      throw new BaseError(409, "Chỉ đăng ký đã phê duyệt mới được hoàn thành");
    }
    if (!/^QUAY_[1-8]$/.test(registration.bo_phan || "")) {
      throw new BaseError(409, "Đăng ký chưa được phân quầy tiếp nhận");
    }

    const completedAt = new Date().toISOString();
    const completed = await DangKyTiepDanRepository.completeApproved(id, {
      trang_thai: TIEP_DAN_STATUS.COMPLETED,
      thoi_gian_hoan_thanh: completedAt,
      nguoi_hoan_thanh: currentUser.userId,
      nguoi_cap_nhat: currentUser.userId,
      thoi_gian_cap_nhat: completedAt,
    });
    if (!completed) {
      throw new BaseError(409, "Đăng ký đã được xử lý bởi người khác");
    }
    return mapStaffRegistrationDetail(completed);
  },

  async reject(id, reason, currentUser) {
    const registration = await DangKyTiepDanRepository.findActiveById(id);
    if (!registration) {
      throw new BaseError(404, "Đăng ký tiếp dân không tồn tại");
    }
    if (registration.trang_thai !== TIEP_DAN_STATUS.PENDING) {
      throw new BaseError(409, "Chỉ đăng ký đang chờ mới được từ chối");
    }

    const rejectedAt = new Date().toISOString();
    const rejected = await DangKyTiepDanRepository.rejectPending(id, {
      trang_thai: TIEP_DAN_STATUS.REJECTED,
      ly_do_tu_choi: reason,
      thoi_gian_tu_choi: rejectedAt,
      nguoi_tu_choi: currentUser.userId,
      nguoi_cap_nhat: currentUser.userId,
      thoi_gian_cap_nhat: rejectedAt,
    });
    if (!rejected) {
      throw new BaseError(409, "Đăng ký đã được xử lý bởi người khác");
    }
    return mapStaffRegistrationDetail(rejected);
  },

  async lookupForRating(receptionCode) {
    const registration = await DangKyTiepDanRepository.findForRatingByCode(
      receptionCode.toUpperCase()
    );
    if (!registration) {
      throw new BaseError(404, "Không tìm thấy mã tiếp dân");
    }
    if (registration.trang_thai !== TIEP_DAN_STATUS.COMPLETED) {
      throw new BaseError(409, "Buổi tiếp dân chưa hoàn thành để đánh giá");
    }
    if (!/^QUAY_[1-8]$/.test(registration.bo_phan || "")) {
      throw new BaseError(409, "Đăng ký chưa được phân quầy tiếp nhận");
    }
    if (registration.danh_gia_tiep_dan?.length > 0) {
      throw new BaseError(409, "Mã tiếp dân đã được đánh giá");
    }

    return mapRatingLookup(registration);
  },
};

export default DangKyTiepDanService;
