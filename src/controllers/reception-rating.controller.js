import ReceptionRatingService from "../services/reception-rating.service.js";
import { successResponse } from "../utils/response.util.js";

const ReceptionRatingController = {
  getConfiguration(req, res) {
    return successResponse(
      res,
      ReceptionRatingService.getConfiguration(),
      "Lấy cấu hình đánh giá tiếp dân thành công"
    );
  },

  async create(req, res) {
    const data = await ReceptionRatingService.create(req.body);
    return successResponse(res, data, "Gửi đánh giá tiếp dân thành công");
  },

  async getAll(req, res) {
    const result = await ReceptionRatingService.getAllForLeader(
      req.validatedQuery
    );
    return successResponse(
      res,
      result.data,
      "Lấy danh sách đánh giá tiếp dân thành công",
      result.pagination
    );
  },

  async getDetail(req, res) {
    const data = await ReceptionRatingService.getDetailForLeader(
      req.validatedParams.id
    );
    return successResponse(res, data, "Lấy chi tiết đánh giá tiếp dân thành công");
  },

  async getStatistics(req, res) {
    const data = await ReceptionRatingService.getStatisticsForLeader(
      req.validatedQuery
    );
    return successResponse(res, data, "Lấy thống kê đánh giá tiếp dân thành công");
  },
};

export default ReceptionRatingController;
