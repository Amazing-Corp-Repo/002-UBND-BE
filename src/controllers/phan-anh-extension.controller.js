import PhanAnhExtensionService from "../services/phan-anh-extension.service.js";
import { successResponse } from "../utils/response.util.js";

const PhanAnhExtensionController = {
  async create(req, res) {
    const result = await PhanAnhExtensionService.create({
      ...req.body,
      files: Array.isArray(req.files) ? req.files : [],
      userId: req.payload.userId,
      cate: req.payload.cate,
    });
    return successResponse(res, result, "Đã gửi đề nghị gia hạn thời gian xử lý thành công");
  },

  async getAll(req, res) {
    const { page, size, status, search, mucDo, idLinhVuc } = req.validatedQuery;
    const { data, pagination } = await PhanAnhExtensionService.getAll({
      page,
      size,
      status,
      search,
      mucDo,
      idLinhVuc,
      permissions: req.payload.permissions || [],
      cate: req.payload.cate,
    });
    return successResponse(res, data, "Lấy danh sách đề nghị gia hạn thành công", pagination);
  },

  async exportExcel(req, res) {
    const buffer = await PhanAnhExtensionService.exportExcel({
      ...req.validatedQuery,
      permissions: req.payload.permissions || [],
      cate: req.payload.cate,
    });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=quan_ly_gia_han.xlsx");
    return res.send(buffer);
  },

  async getById(req, res) {
    const result = await PhanAnhExtensionService.getById(req.validatedParams.id, {
      permissions: req.payload.permissions || [],
      cate: req.payload.cate,
    });
    return successResponse(res, result, "Lấy chi tiết đề nghị gia hạn thành công");
  },

  async approve(req, res) {
    const result = await PhanAnhExtensionService.approve(
      req.validatedParams.id,
      req.payload.userId,
      req.body.ghiChu,
    );
    return successResponse(res, result, "Phê duyệt gia hạn thời gian giải quyết thành công");
  },

  async reject(req, res) {
    const result = await PhanAnhExtensionService.reject(
      req.validatedParams.id,
      req.payload.userId,
      req.body.lyDoTuChoi,
    );
    return successResponse(res, result, "Đã từ chối đề nghị gia hạn");
  },
};

export default PhanAnhExtensionController;
