import {
  RECEPTION_RATING_COMMENT_MAX_LENGTH,
  RECEPTION_RATING_COUNTER_CODES,
  RECEPTION_RATING_SCALE,
  RECEPTION_RATING_SUGGESTIONS,
} from "../constants/reception-rating.constant.js";
import ReceptionRatingRepository from "../repositories/reception-rating.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import {
  formatVietnamDate,
  normalizeReceptionTimes,
  toDatabaseDate,
} from "../utils/vietnam-time.util.js";

const isUniqueConstraintError = (error) => error?.code === "P2002";

const mapRatingFields = (rating) => ({
  id: rating.id,
  receptionCode: rating.ma_tiep_dan,
  citizenName: rating.ten_nguoi_dan,
  applicantName: rating.ten_nguoi_dan,
  officerName: rating.ten_can_bo,
  counterCode: rating.ma_quay,
  department: rating.ma_quay,
  receptionDate: rating.ngay_tiep_dan,
  timeSlot: rating.khung_gio,
  workingContent: rating.noi_dung_lam_viec,
  topic: rating.noi_dung_lam_viec,
  score: rating.diem_tong,
  selectedSuggestions: rating.ly_do || [],
  comment: rating.nhan_xet || "",
  ratedAt: rating.thoi_gian_tao,
  createdAt: rating.thoi_gian_tao,
});

const mapRating = (rating) => normalizeReceptionTimes(mapRatingFields(rating));

const mapRatingDetail = (rating) => {
  const legacy = rating.dang_ky_tiep_dan;
  const mapped = mapRatingFields(rating);
  return normalizeReceptionTimes({
    ...mapped,
    legacyRegistrationId: rating.id_dang_ky_tiep_dan,
    registration: {
      id: rating.id_dang_ky_tiep_dan,
      receptionCode: rating.ma_tiep_dan,
      receptionDate: rating.ngay_tiep_dan,
      timeSlot: rating.khung_gio,
      topic: rating.noi_dung_lam_viec,
      workingContent: rating.noi_dung_lam_viec,
      applicant: {
        fullName: rating.ten_nguoi_dan,
        phoneNumber: legacy?.sdt || null,
        citizenId: legacy?.cccd || null,
        address: legacy?.dia_chi || null,
      },
      department: rating.ma_quay,
      approvalStatus: legacy?.trang_thai || null,
      approver: legacy?.ten_lanh_dao
        ? {
            name: legacy.ten_lanh_dao,
            title: legacy.chuc_vu_lanh_dao,
            approvedAt:
              legacy.thoi_gian_phe_duyet || legacy.thoi_gian_cap_nhat,
          }
        : null,
      schedule: legacy?.lich_tiep_dan
        ? {
            id: legacy.lich_tiep_dan.id,
            officerName: legacy.lich_tiep_dan.ten_can_bo,
            location: legacy.lich_tiep_dan.dia_diem,
            receptionDate: legacy.lich_tiep_dan.ngay_tiep_dan,
            timeRange: legacy.lich_tiep_dan.thoi_gian,
            note: legacy.lich_tiep_dan.ghi_chu,
          }
        : null,
    },
  });
};

const normalizeDateFilters = (filters) => {
  const normalized = {
    ...filters,
    fromDate: filters.fromDate
      ? formatVietnamDate(filters.fromDate)
      : undefined,
    toDate: filters.toDate ? formatVietnamDate(filters.toDate) : undefined,
  };
  if (
    normalized.fromDate &&
    normalized.toDate &&
    normalized.fromDate > normalized.toDate
  ) {
    throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
  }
  return normalized;
};

const validateSuggestions = (input) => {
  const allowedSuggestions = new Set(
    RECEPTION_RATING_SUGGESTIONS[input.score] || []
  );
  if (
    input.selectedSuggestions.some(
      (suggestion) => !allowedSuggestions.has(suggestion)
    )
  ) {
    throw new BaseError(
      400,
      "Gợi ý đã chọn không phù hợp với số sao đánh giá"
    );
  }
};

const roundToTwoDecimals = (value) =>
  value === null || value === undefined ? 0 : Math.round(value * 100) / 100;

const ReceptionRatingService = {
  getConfiguration() {
    return {
      scale: RECEPTION_RATING_SCALE,
      comment: { maxLength: RECEPTION_RATING_COMMENT_MAX_LENGTH },
      counters: RECEPTION_RATING_COUNTER_CODES.map((code, index) => ({
        code,
        name: `Quầy ${index + 1}`,
      })),
      suggestionsByScore: RECEPTION_RATING_SUGGESTIONS,
    };
  },

  async create(input) {
    const existing = await ReceptionRatingRepository.findByReceptionCode(
      input.receptionCode
    );
    if (existing) {
      throw new BaseError(409, "Mã tiếp dân đã được đánh giá");
    }
    validateSuggestions(input);

    try {
      const rating = await ReceptionRatingRepository.create({
        id_dang_ky_tiep_dan: null,
        ma_tiep_dan: input.receptionCode,
        ten_nguoi_dan: input.citizenName,
        ten_can_bo: input.officerName,
        ma_quay: input.counterCode,
        ngay_tiep_dan: toDatabaseDate(input.receptionDate),
        khung_gio: input.timeSlot,
        noi_dung_lam_viec: input.workingContent,
        diem_tong: input.score,
        tieu_chi: null,
        ly_do: input.selectedSuggestions,
        nhan_xet: input.comment,
        nguoi_tao: null,
      });
      return mapRating(rating);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BaseError(409, "Mã tiếp dân đã được đánh giá");
      }
      throw error;
    }
  },

  async getAllForLeader(filters) {
    const normalized = normalizeDateFilters(filters);
    const { data, totalItems } =
      await ReceptionRatingRepository.findAllForLeader(normalized);
    return {
      data: data.map(mapRating),
      pagination: createPagination(filters.page, filters.size, totalItems),
    };
  },

  async getDetailForLeader(id) {
    const rating = await ReceptionRatingRepository.findDetailById(id);
    if (
      !rating ||
      (rating.dang_ky_tiep_dan &&
        rating.dang_ky_tiep_dan.loai !== "COUNTER_RECEPTION")
    ) {
      throw new BaseError(404, "Đánh giá tiếp dân không tồn tại");
    }
    return mapRatingDetail(rating);
  },

  async getStatisticsForLeader(filters) {
    const normalized = normalizeDateFilters(filters);
    const { overall, scoreGroups, counterGroups, officerGroups } =
      await ReceptionRatingRepository.getStatistics(normalized);
    const totalRatings = overall._count._all;
    const countByScore = new Map(
      scoreGroups.map((group) => [group.diem_tong, group._count._all])
    );
    const scoreDistribution = Array.from({ length: 5 }, (_, index) => ({
      score: index + 1,
      count: countByScore.get(index + 1) || 0,
    }));
    const satisfiedCount =
      (countByScore.get(4) || 0) + (countByScore.get(5) || 0);
    const byCounter = counterGroups.map((group) => ({
      counterCode: group.counterCode,
      totalRatings: group._count._all,
      averageScore: roundToTwoDecimals(group._avg.diem_tong),
    }));

    return {
      totalRatings,
      averageScore: roundToTwoDecimals(overall._avg.diem_tong),
      satisfactionRate:
        totalRatings === 0
          ? 0
          : roundToTwoDecimals((satisfiedCount / totalRatings) * 100),
      scoreDistribution,
      byCounter,
      byDepartment: byCounter.map((item) => ({
        department: item.counterCode,
        totalRatings: item.totalRatings,
        averageScore: item.averageScore,
      })),
      byOfficer: officerGroups.map((group) => ({
        officerName: group.ten_can_bo,
        totalRatings: group._count._all,
        averageScore: roundToTwoDecimals(group._avg.diem_tong),
      })),
    };
  },
};

export default ReceptionRatingService;
