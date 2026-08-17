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
};

export default ReceptionRatingController;
