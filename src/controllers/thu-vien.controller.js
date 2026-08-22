import ThuVienService from "../services/thu-vien.service.js";
import { successResponse } from "../utils/response.util.js";

const ThuVienController = {
  // ========== VĂN HÓA & PHÁP LUẬT (dùng chung) ==========

  async getAll(req, res) {
    const { page = 1, size = 10, search, idDanhMuc, trangThai, phamVi, aiDaHoc, dateFrom, dateTo, sortBy, sortOrder, coQuanBanHanh } = req.query;
    const loai = req.loai;
    const result = await ThuVienService.getAll({ loai, page, size, search, idDanhMuc, trangThai, phamVi, aiDaHoc, dateFrom, dateTo, sortBy, sortOrder, coQuanBanHanh });
    return successResponse(res, result.data, "Lấy danh sách tài liệu thành công", result.pagination);
  },

  async getById(req, res) {
    const { id } = req.params;
    const result = await ThuVienService.getById(id);
    return successResponse(res, result, "Lấy chi tiết tài liệu thành công");
  },

  async create(req, res) {
    const loai = req.loai;
    const currentUser = req.payload.userId;
    const files = req.files;
    const result = await ThuVienService.create({ loai, data: req.body, files, currentUser });
    return successResponse(res, result, "Tạo tài liệu thành công");
  },

  async update(req, res) {
    const { id } = req.params;
    const currentUser = req.payload.userId;
    const files = req.files;
    const result = await ThuVienService.update({ id, data: req.body, files, currentUser });
    return successResponse(res, result, "Cập nhật tài liệu thành công");
  },

  async delete(req, res) {
    const { id } = req.params;
    const currentUser = req.payload.userId;
    await ThuVienService.delete(id, currentUser);
    return successResponse(res, null, "Xóa tài liệu thành công");
  },

  async updateStatus(req, res) {
    const { id } = req.params;
    const { trangThai } = req.body;
    const currentUser = req.payload.userId;
    const result = await ThuVienService.updateStatus(id, trangThai, currentUser);
    return successResponse(res, result, "Cập nhật trạng thái thành công");
  },

  async aiLearn(req, res) {
    const { id } = req.params;
    const { action } = req.body;
    const currentUser = req.payload.userId;
    const result = await ThuVienService.aiLearn(id, action, currentUser);
    return successResponse(res, result, "Đồng bộ AI thành công");
  },

  async approve(req, res) {
    const { id } = req.params;
    const currentUser = req.payload.userId;
    const result = await ThuVienService.approve(id, currentUser);
    return successResponse(res, result, "Phê duyệt tài liệu thành công");
  },

  async reject(req, res) {
    const { id } = req.params;
    const { lyDoTuChoi } = req.body;
    const currentUser = req.payload.userId;
    const result = await ThuVienService.reject(id, lyDoTuChoi, currentUser);
    return successResponse(res, result, "Từ chối tài liệu thành công");
  },

  async getStatistics(req, res) {
    const loai = req.loai;
    const result = await ThuVienService.getStatistics(loai);
    return successResponse(res, result, "Lấy thống kê thành công");
  },

  async getSubCategories(req, res) {
    const loai = req.loai;
    const result = await ThuVienService.getSubCategories(loai);
    return successResponse(res, result, "Lấy danh sách tiểu mục thành công");
  },

  async getDocTypes(req, res) {
    const result = await ThuVienService.getDocTypes();
    return successResponse(res, result, "Lấy danh sách loại văn bản thành công");
  },

  async getIssuingAgencies(req, res) {
    const result = await ThuVienService.getIssuingAgencies();
    return successResponse(res, result, "Lấy danh sách cơ quan ban hành thành công");
  },

  async download(req, res) {
    const { id } = req.params;
    const result = await ThuVienService.getById(id);
    if (!result) {
      throw new BaseError(404, "Không tìm thấy tài liệu");
    }

    await ThuVienService.incrementDownloadCount(id);

    // Trả về thông tin file để FE download
    const fileInfo = result.thu_vien_tai_lieu_file?.[0];
    if (!fileInfo) {
      throw new BaseError(404, "Tài liệu không có file đính kèm");
    }

    return successResponse(res, {
      id: result.id,
      fileUrl: fileInfo.duong_dan,
      fileName: fileInfo.ten_file,
      fileSize: fileInfo.kich_thuoc_mb,
    }, "Lấy thông tin tải xuống thành công");
  },

  async deleteMedia(req, res) {
    const { id, mediaId } = req.params;
    const currentUser = req.payload.userId;
    await ThuVienService.deleteMedia(id, mediaId, currentUser);
    return successResponse(res, null, "Xóa media thành công");
  },
};

export default ThuVienController;