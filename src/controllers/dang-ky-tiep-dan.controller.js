import DangKyTiepDanService from "../services/dang-ky-tiep-dan.service.js";
import { successResponse } from "../utils/response.util.js";

const DangKyTiepDanController = {
  async create(req, res) {
    const data = await DangKyTiepDanService.createCounterReception(req.body);
    return successResponse(res, data, "Đăng ký lịch tiếp dân thành công");
  },

  async lookup(req, res) {
    const data = await DangKyTiepDanService.lookupForCitizen(req.body);
    return successResponse(res, data, "Tra cứu đăng ký tiếp dân thành công");
  },

  async getAll(req, res) {
    const result = await DangKyTiepDanService.getAllForStaff(
      req.validatedQuery
    );
    return successResponse(
      res,
      result.data,
      "Lấy danh sách đăng ký tiếp dân thành công",
      result.pagination
    );
  },

  async getDetail(req, res) {
    const data = await DangKyTiepDanService.getDetailForStaff(
      req.validatedParams.id
    );
    return successResponse(res, data, "Lấy chi tiết đăng ký tiếp dân thành công");
  },

  async approve(req, res) {
    const data = await DangKyTiepDanService.approve(
      req.validatedParams.id,
      req.body.department,
      req.payload
    );
    return successResponse(res, data, "Phê duyệt đăng ký tiếp dân thành công");
  },

  async complete(req, res) {
    const data = await DangKyTiepDanService.complete(
      req.validatedParams.id,
      req.payload
    );
    return successResponse(res, data, "Hoàn thành buổi tiếp dân thành công");
  },

  async lookupForRating(req, res) {
    const data = await DangKyTiepDanService.lookupForRating(
      req.validatedParams.receptionCode
    );
    return successResponse(res, data, "Tra cứu mã tiếp dân để đánh giá thành công");
  },
};

export default DangKyTiepDanController;
