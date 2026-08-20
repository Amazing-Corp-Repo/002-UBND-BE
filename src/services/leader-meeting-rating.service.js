import {
  LEADER_MEETING_RATING_COMMENT_MAX_LENGTH,
  LEADER_MEETING_RATING_SCALE,
  LEADER_MEETING_RATING_SUGGESTIONS,
} from "../constants/leader-meeting-rating.constant.js";
import LeaderMeetingRatingRepository from "../repositories/leader-meeting-rating.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";

const LeaderMeetingRatingService = {
  getConfiguration() {
    return {
      scale: LEADER_MEETING_RATING_SCALE,
      comment: { maxLength: LEADER_MEETING_RATING_COMMENT_MAX_LENGTH },
      suggestionsByScore: LEADER_MEETING_RATING_SUGGESTIONS,
      eligibility: { requiredRegistrationStatus: "COMPLETED" },
    };
  },

  async create(input) {
    const registration = await LeaderMeetingRatingRepository.findRegistrationByCode(
      input.registrationCode
    );
    if (!registration) {
      throw new BaseError(404, "Không tìm thấy mã đăng ký gặp lãnh đạo");
    }
    if (registration.trang_thai !== "COMPLETED") {
      throw new BaseError(409, "Buổi gặp lãnh đạo chưa hoàn thành để đánh giá");
    }
    if (registration.danh_gia_gap_lanh_dao) {
      throw new BaseError(409, "Mã đăng ký gặp lãnh đạo đã được đánh giá");
    }
    const allowedSuggestions = new Set(
      LEADER_MEETING_RATING_SUGGESTIONS[input.score] || []
    );
    if (input.selectedSuggestions.some((item) => !allowedSuggestions.has(item))) {
      throw new BaseError(400, "Gợi ý đã chọn không phù hợp với số sao đánh giá");
    }
    try {
      const rating = await LeaderMeetingRatingRepository.create({
        id_dang_ky_gap_lanh_dao: registration.id,
        diem_tong: input.score,
        tieu_chi: null,
        ly_do: input.selectedSuggestions,
        nhan_xet: input.comment || null,
      });
      return {
        id: rating.id,
        registrationCode: registration.ma_dang_ky,
        score: rating.diem_tong,
        selectedSuggestions: rating.ly_do || [],
        comment: rating.nhan_xet || "",
        createdAt: rating.thoi_gian_tao,
      };
    } catch (error) {
      if (error?.code === "P2002") {
        throw new BaseError(409, "Mã đăng ký gặp lãnh đạo đã được đánh giá");
      }
      throw error;
    }
  },

  async getAll(filters, currentUser) {
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }
    const roles = currentUser.roles || [];
    const canViewAll = roles.some((role) =>
      ["ADMIN", "APPROVER", "PHE_DUYET"].includes(role)
    );
    const result = await LeaderMeetingRatingRepository.findAll({
      ...filters,
      leaderId: canViewAll ? filters.leaderId : currentUser.userId,
    });
    return {
      data: result.data.map((rating) => {
        const registration = rating.dang_ky_gap_lanh_dao;
        const slot = registration.khung_gio_gap_lanh_dao;
        const schedule = slot.lich_gap_lanh_dao;
        return {
          id: rating.id,
          registrationCode: registration.ma_dang_ky,
          applicantName: registration.ho_ten,
          appointmentDate: registration.ngay_hen,
          timeSlot: `${slot.gio_bat_dau} - ${slot.gio_ket_thuc}`,
          topic: registration.chu_de,
          location: schedule.dia_diem,
          leader: { id: schedule.lanh_dao.id, fullName: schedule.lanh_dao.ho_va_ten },
          score: rating.diem_tong,
          selectedSuggestions: rating.ly_do || [],
          comment: rating.nhan_xet || "",
          ratedAt: rating.thoi_gian_tao,
        };
      }),
      pagination: createPagination(filters.page, filters.limit, result.totalItems),
    };
  },
};

export default LeaderMeetingRatingService;
