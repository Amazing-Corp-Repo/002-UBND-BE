import {
  RECEPTION_RATING_COMMENT_MAX_LENGTH,
  RECEPTION_RATING_SCALE,
  RECEPTION_RATING_SUGGESTIONS,
} from "../constants/reception-rating.constant.js";
import ReceptionRatingRepository from "../repositories/reception-rating.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { TIEP_DAN_STATUS } from "../constants/tiep-dan.constant.js";
import { createPagination } from "../utils/response.util.js";

const isUniqueConstraintError = (error) => error?.code === "P2002";

const mapRating = (rating, receptionCode) => ({
  id: rating.id,
  receptionCode,
  score: rating.diem_tong,
  selectedSuggestions: rating.ly_do || [],
  comment: rating.nhan_xet || "",
  createdAt: rating.thoi_gian_tao,
});

const mapRatingListItem = (rating) => ({
  id: rating.id,
  receptionCode: rating.dang_ky_tiep_dan.ma_tiep_dan,
  applicantName: rating.dang_ky_tiep_dan.ho_ten,
  department: rating.dang_ky_tiep_dan.bo_phan,
  receptionDate: rating.dang_ky_tiep_dan.ngay,
  timeSlot: rating.dang_ky_tiep_dan.slot,
  topic: rating.dang_ky_tiep_dan.chu_de,
  score: rating.diem_tong,
  selectedSuggestions: rating.ly_do || [],
  comment: rating.nhan_xet || "",
  ratedAt: rating.thoi_gian_tao,
});

const ReceptionRatingService = {
  getConfiguration() {
    return {
      scale: RECEPTION_RATING_SCALE,
      comment: {
        maxLength: RECEPTION_RATING_COMMENT_MAX_LENGTH,
      },
      suggestionsByScore: RECEPTION_RATING_SUGGESTIONS,
    };
  },

  async create(input) {
    const registration = await ReceptionRatingRepository.findRegistrationByCode(
      input.receptionCode
    );
    if (!registration) {
      throw new BaseError(404, "Không tìm thấy mã tiếp dân");
    }
    if (registration.trang_thai !== TIEP_DAN_STATUS.APPROVED) {
      throw new BaseError(409, "Đăng ký chưa được phê duyệt để đánh giá");
    }
    if (!/^QUAY_[1-8]$/.test(registration.bo_phan || "")) {
      throw new BaseError(409, "Đăng ký chưa được phân quầy tiếp nhận");
    }
    if (registration.danh_gia_tiep_dan?.length > 0) {
      throw new BaseError(409, "Mã tiếp dân đã được đánh giá");
    }

    const allowedSuggestions = new Set(
      RECEPTION_RATING_SUGGESTIONS[input.score] || []
    );
    const invalidSuggestion = input.selectedSuggestions.find(
      (suggestion) => !allowedSuggestions.has(suggestion)
    );
    if (invalidSuggestion) {
      throw new BaseError(
        400,
        "Gợi ý đã chọn không phù hợp với số sao đánh giá"
      );
    }

    try {
      const rating = await ReceptionRatingRepository.create({
        id_dang_ky_tiep_dan: registration.id,
        diem_tong: input.score,
        tieu_chi: null,
        ly_do: input.selectedSuggestions,
        nhan_xet: input.comment || null,
      });
      return mapRating(rating, input.receptionCode);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new BaseError(409, "Mã tiếp dân đã được đánh giá");
      }
      throw error;
    }
  },

  async getAllForLeader(filters) {
    const normalized = {
      ...filters,
      fromDate: filters.fromDate
        ? new Date(filters.fromDate).toISOString().slice(0, 10)
        : undefined,
      toDate: filters.toDate
        ? new Date(filters.toDate).toISOString().slice(0, 10)
        : undefined,
    };
    if (
      normalized.fromDate &&
      normalized.toDate &&
      normalized.fromDate > normalized.toDate
    ) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }

    const { data, totalItems } =
      await ReceptionRatingRepository.findAllForLeader(normalized);
    return {
      data: data.map(mapRatingListItem),
      pagination: createPagination(filters.page, filters.size, totalItems),
    };
  },
};

export default ReceptionRatingService;
