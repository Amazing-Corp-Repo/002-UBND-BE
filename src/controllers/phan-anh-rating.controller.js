import PhanAnhRatingService from "../services/phan-anh-rating.service.js";
import { successResponse } from "../utils/response.util.js";

const PhanAnhRatingController = {
  getConfiguration(_req, res) {
    return successResponse(res, PhanAnhRatingService.getConfiguration(), "Lấy cấu hình đánh giá phản ánh thành công");
  },

  async create(req, res) {
    const data = await PhanAnhRatingService.create(req.body);
    return successResponse(res, data, "Gửi đánh giá phản ánh thành công");
  },

  async getAll(req, res) {
    const result = await PhanAnhRatingService.getAll(req.validatedQuery, req.payload);
    return successResponse(res, result.data, "Lấy danh sách đánh giá phản ánh thành công", result.pagination);
  },

  async getStatistics(req, res) {
    const data = await PhanAnhRatingService.getStatistics(req.validatedQuery, req.payload);
    return successResponse(res, data, "Lấy thống kê đánh giá phản ánh thành công");
  },

  async getDetail(req, res) {
    const data = await PhanAnhRatingService.getDetail(req.validatedParams.id, req.payload);
    return successResponse(res, data, "Lấy chi tiết đánh giá phản ánh thành công");
  },
};

export default PhanAnhRatingController;
