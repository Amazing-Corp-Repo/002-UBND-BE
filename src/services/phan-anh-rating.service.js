import PHAN_ANH_STATUS from "../constants/phan-anh-status.constant.js";
import {
  PHAN_ANH_RATING_COMMENT_MAX_LENGTH,
  PHAN_ANH_RATING_SCALE,
} from "../constants/phan-anh-rating.constant.js";
import { PERMISSION } from "../constants/permission.constant.js";
import PhanAnhRatingRepository from "../repositories/phan-anh-rating.repository.js";
import { hasPermission } from "../utils/auth-context.util.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { parseCommaString } from "../utils/string.util.js";

const resolveScope = (currentUser, selectedLinhVuc) => {
  const scopedLinhVucIds = hasPermission(currentUser, PERMISSION.PA_THUONG_TRUC)
    ? undefined
    : parseCommaString(currentUser?.cate);

  if (
    selectedLinhVuc &&
    scopedLinhVucIds !== undefined &&
    !scopedLinhVucIds.includes(selectedLinhVuc)
  ) {
    throw new BaseError(403, "Bạn không có quyền truy cập lĩnh vực phản ánh này");
  }

  return scopedLinhVucIds;
};

const toRatingItem = (rating) => ({
  id: rating.id,
  complaint: {
    id: rating.phan_anh.id,
    code: rating.phan_anh.ma_phan_anh,
    title: rating.phan_anh.tieu_de || "",
    category: rating.phan_anh.linh_vuc_phan_anh
      ? { id: rating.phan_anh.linh_vuc_phan_anh.id, name: rating.phan_anh.linh_vuc_phan_anh.ten || "" }
      : null,
  },
  score: rating.diem,
  comment: rating.nhan_xet || "",
  ratedAt: rating.thoi_gian_tao,
});

const PhanAnhRatingService = {
  getConfiguration() {
    return {
      scale: PHAN_ANH_RATING_SCALE,
      comment: { maxLength: PHAN_ANH_RATING_COMMENT_MAX_LENGTH },
      eligibility: { requiredComplaintStatus: PHAN_ANH_STATUS.DA_GIAI_QUYET },
    };
  },
  async getByComplaintCode(complaintCode) {
    const complaint = await PhanAnhRatingRepository.findRatingStatusByComplaintCode(complaintCode);
    if (!complaint) throw new BaseError(404, "Không tìm thấy mã phản ánh");
    const latestStatus = complaint.lich_su_trang_thai?.[0]?.ten || null;
    const isResolved = latestStatus === PHAN_ANH_STATUS.DA_GIAI_QUYET;
    const existingRating = complaint.danh_gia_phan_anh?.[0] || null;
    const isRated = Boolean(existingRating);
    return { complaint: { id: complaint.id, code: complaint.ma_phan_anh, title: complaint.tieu_de || "", category: complaint.linh_vuc_phan_anh ? { id: complaint.linh_vuc_phan_anh.id, name: complaint.linh_vuc_phan_anh.ten || "" } : null }, status: latestStatus, isResolved, isRated, canRate: isResolved && !isRated, message: !isResolved ? "Phản ánh đang trong quá trình xử lý, chỉ có thể đánh giá sau khi đã giải quyết" : isRated ? "Mã phản ánh đã được đánh giá" : null, rating: existingRating ? { id: existingRating.id, score: existingRating.diem, comment: existingRating.nhan_xet || "", ratedAt: existingRating.thoi_gian_tao } : null };
  },

  async create(input) {
    const complaint = await PhanAnhRatingRepository.findComplaintByCode(input.complaintCode);
    if (!complaint) {
      throw new BaseError(404, "Không tìm thấy mã phản ánh");
    }
    if (complaint.lich_su_trang_thai[0]?.ten !== PHAN_ANH_STATUS.DA_GIAI_QUYET) {
      throw new BaseError(409, "Phản ánh chưa được giải quyết để đánh giá");
    }
    if (complaint.danh_gia_phan_anh.length > 0) {
      throw new BaseError(409, "Mã phản ánh đã được đánh giá");
    }

    try {
      const rating = await PhanAnhRatingRepository.create({
        id_phan_anh: complaint.id,
        diem: input.score,
        nhan_xet: input.comment || null,
      });
      return {
        id: rating.id,
        complaintCode: complaint.ma_phan_anh,
        score: rating.diem,
        comment: rating.nhan_xet || "",
        createdAt: rating.thoi_gian_tao,
      };
    } catch (error) {
      if (error?.code === "P2002") {
        throw new BaseError(409, "Mã phản ánh đã được đánh giá");
      }
      throw error;
    }
  },

  async getAll(filters, currentUser) {
    const scopedLinhVucIds = resolveScope(currentUser, filters.idLinhVucPhanAnh);
    const result = await PhanAnhRatingRepository.findAll({ ...filters, scopedLinhVucIds });
    return {
      data: result.data.map(toRatingItem),
      pagination: createPagination(filters.page, filters.limit, result.totalItems),
    };
  },

  async getStatistics(filters, currentUser) {
    const scopedLinhVucIds = resolveScope(currentUser, filters.idLinhVucPhanAnh);
    const result = await PhanAnhRatingRepository.getStatistics({ ...filters, scopedLinhVucIds });
    const totalRatings = result.overall._count._all;
    const countByScore = new Map(result.scoreGroups.map((group) => [group.diem, group._count._all]));
    const byCategory = new Map();
    for (const rating of result.ratings) {
      const category = rating.phan_anh.linh_vuc_phan_anh;
      const key = category?.id || "unassigned";
      const item = byCategory.get(key) || {
        category: category ? { id: category.id, name: category.ten || "" } : null,
        totalRatings: 0,
        totalScore: 0,
      };
      item.totalRatings += 1;
      item.totalScore += rating.diem;
      byCategory.set(key, item);
    }
    const round = (value) => Math.round(value * 100) / 100;
    const satisfied = (countByScore.get(4) || 0) + (countByScore.get(5) || 0);
    return {
      totalRatings,
      averageScore: round(result.overall._avg.diem || 0),
      satisfactionRate: totalRatings ? round((satisfied / totalRatings) * 100) : 0,
      scoreDistribution: Array.from({ length: 5 }, (_, index) => ({
        score: index + 1,
        count: countByScore.get(index + 1) || 0,
      })),
      byCategory: Array.from(byCategory.values())
        .map(({ category, totalRatings: categoryTotal, totalScore }) => ({
          category,
          totalRatings: categoryTotal,
          averageScore: round(totalScore / categoryTotal),
        }))
        .sort((left, right) => right.totalRatings - left.totalRatings),
    };
  },

  async getDetail(id, currentUser) {
    const rating = await PhanAnhRatingRepository.findDetail(id, resolveScope(currentUser));
    if (!rating) {
      throw new BaseError(404, "Đánh giá phản ánh không tồn tại");
    }
    return toRatingItem(rating);
  },
};

export default PhanAnhRatingService;
