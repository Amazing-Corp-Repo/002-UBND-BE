import {
  LEADER_MEETING_RATING_COMMENT_MAX_LENGTH,
  LEADER_MEETING_RATING_SCALE,
} from "../constants/leader-meeting-rating.constant.js";
import LeaderMeetingRatingRepository from "../repositories/leader-meeting-rating.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { normalizeRoleNames } from "../utils/auth-context.util.js";

const LeaderMeetingRatingService = {
  getConfiguration() {
    return {
      scale: LEADER_MEETING_RATING_SCALE,
      comment: { maxLength: LEADER_MEETING_RATING_COMMENT_MAX_LENGTH },
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
    try {
      const rating = await LeaderMeetingRatingRepository.create({
        id_dang_ky_gap_lanh_dao: registration.id,
        diem_tong: input.score,
        tieu_chi: null,
        ly_do: null,
        nhan_xet: input.comment || null,
      });
      return {
        id: rating.id,
        registrationCode: registration.ma_dang_ky,
        score: rating.diem_tong,
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
    const roles = normalizeRoleNames(currentUser.roles);
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
          location: schedule.dia_diem,
          leader: { id: schedule.lanh_dao.id, fullName: schedule.lanh_dao.ho_va_ten },
          score: rating.diem_tong,
          comment: rating.nhan_xet || "",
          ratedAt: rating.thoi_gian_tao,
        };
      }),
      pagination: createPagination(filters.page, filters.limit, result.totalItems),
    };
  },

  async getStatistics(filters, currentUser) {
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      throw new BaseError(400, "Ngày bắt đầu không được sau ngày kết thúc");
    }
    const roles = normalizeRoleNames(currentUser.roles);
    const canViewAll = roles.some((role) =>
      ["ADMIN", "APPROVER", "PHE_DUYET"].includes(role)
    );
    const result = await LeaderMeetingRatingRepository.getStatistics({
      ...filters,
      leaderId: canViewAll ? filters.leaderId : currentUser.userId,
    });
    const totalRatings = result.overall._count._all;
    const countByScore = new Map(
      result.scoreGroups.map((group) => [group.diem_tong, group._count._all])
    );
    const round = (value) => Math.round(value * 100) / 100;
    const satisfied = (countByScore.get(4) || 0) + (countByScore.get(5) || 0);
    return {
      totalRatings,
      averageScore: round(result.overall._avg.diem_tong || 0),
      satisfactionRate: totalRatings ? round((satisfied / totalRatings) * 100) : 0,
      scoreDistribution: Array.from({ length: 5 }, (_, index) => ({
        score: index + 1,
        count: countByScore.get(index + 1) || 0,
      })),
      byLeader: result.leaderGroups.map((item) => ({
        leader: { id: item.leaderId, fullName: item.leaderName },
        totalRatings: item.totalRatings,
        averageScore: round(item.averageScore),
      })),
    };
  },

  async getDetail(id, currentUser) {
    const roles = normalizeRoleNames(currentUser.roles);
    const canViewAll = roles.some((role) =>
      ["ADMIN", "APPROVER", "PHE_DUYET"].includes(role)
    );
    const rating = await LeaderMeetingRatingRepository.findDetail(
      id,
      canViewAll ? undefined : currentUser.userId
    );
    if (!rating) {
      throw new BaseError(404, "Đánh giá gặp lãnh đạo không tồn tại");
    }
    const registration = rating.dang_ky_gap_lanh_dao;
    const slot = registration.khung_gio_gap_lanh_dao;
    const schedule = slot.lich_gap_lanh_dao;
    return {
      id: rating.id,
      score: rating.diem_tong,
      criteria: rating.tieu_chi,
      comment: rating.nhan_xet || "",
      ratedAt: rating.thoi_gian_tao,
      registration: {
        id: registration.id,
        registrationCode: registration.ma_dang_ky,
        applicationDate: registration.ngay_lam_don,
        appointmentDate: registration.ngay_hen,
        timeSlot: `${slot.gio_bat_dau} - ${slot.gio_ket_thuc}`,
        reason: registration.ly_do,
        status: registration.trang_thai,
        completedAt: registration.thoi_gian_hoan_thanh,
        applicant: {
          fullName: registration.ho_ten,
          phoneNumber: registration.sdt,
          citizenId: registration.cccd,
          address: registration.dia_chi,
        },
        location: schedule.dia_diem,
        leader: {
          id: schedule.lanh_dao.id,
          fullName: schedule.lanh_dao.ho_va_ten,
          email: schedule.lanh_dao.email,
          phoneNumber: schedule.lanh_dao.so_dien_thoai,
        },
      },
    };
  },
};

export default LeaderMeetingRatingService;
