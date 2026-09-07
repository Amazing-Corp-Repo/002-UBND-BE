import PhanAnhExtensionService from "../services/phan-anh-extension.service.js";
import { successResponse } from "../utils/response.util.js";

const PhanAnhExtensionController = {
  async create(req, res) {
    const result = await PhanAnhExtensionService.create(
      req.validatedParams.idPhanAnh,
      req.body,
      req.payload.userId,
      req.files,
    );
    return successResponse(res, result, "Tạo đề nghị gia hạn phản ánh thành công");
  },

  async getDetail(req, res) {
    const result = await PhanAnhExtensionService.getDetail(req.validatedParams.idPhanAnh);
    return successResponse(res, result, "Lấy đề nghị gia hạn phản ánh thành công");
  },

  async getAll(req, res) {
    const { data, pagination } = await PhanAnhExtensionService.getAll(req.validatedQuery);
    return successResponse(res, data, "Lấy danh sách đề nghị gia hạn phản ánh thành công", pagination);
  },

  async approve(req, res) {
    const result = await PhanAnhExtensionService.approve(req.validatedParams.idPhanAnh, req.payload.userId);
    return successResponse(res, result, "Phê duyệt đề nghị gia hạn phản ánh thành công");
  },

  async reject(req, res) {
    const result = await PhanAnhExtensionService.reject(
      req.validatedParams.idPhanAnh,
      req.body.lyDoTuChoi,
      req.payload.userId,
    );
    return successResponse(res, result, "Từ chối đề nghị gia hạn phản ánh thành công");
  },
};

export default PhanAnhExtensionController;
