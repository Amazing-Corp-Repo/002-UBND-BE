import PhanAnhService from "../services/phan-anh.service.js";
import { successResponse } from "../utils/response.util.js";
import { parseStringToArray } from "../utils/string.util.js";
import { toDbPhanAnhStatus } from "../utils/phan-anh-status.util.js";
import { formatVietnamDate } from "../utils/vietnam-time.util.js";

const PhanAnhController = {
  async createPhanAnh(req, res) {
    let {
      idLinhVucPhanAnh,
      tieuDe,
      moTa,
      viTri,
      mucDo,
      tenNguoiPhanAnh,
      soDienThoaiNguoiPhanAnh,
      khuPho,
      moTaViTri,
      idVideo,
    } = req.body;
    const file = req.files;
    idVideo = parseStringToArray(idVideo);
    let result = await PhanAnhService.createPhanAnh(
      idLinhVucPhanAnh,
      tieuDe,
      moTa,
      viTri,
      mucDo,
      tenNguoiPhanAnh,
      soDienThoaiNguoiPhanAnh,
      khuPho,
      moTaViTri,
      req.payload.userId,
      file,
      idVideo,
    );
    return successResponse(res, result, "Tạo phản ánh thành công");
  },

  async getPhanAnhByMaPhanAnh(req, res) {
    const { maPhanAnh } = req.validatedParams;
    let result = await PhanAnhService.getPhanAnhByMaPhanAnh(maPhanAnh);
    return successResponse(res, result, "Lấy thông tin phản ánh thành công");
  },

  async getAllPhanAnh(req, res) {
    const {
      idLinhVucPhanAnh,
      trangThai,
      mucDo,
      maPhanAnh,
      idLinhVuc,
      startDate,
      endDate,
      khuPho,
      search,
      page = 1,
      size = 10,
      sortTime,
      sortBy,
      sortOrder,
    } = req.validatedQuery;
    const payload = req.payload;
    let { data, pagination } = await PhanAnhService.getAll(
      idLinhVucPhanAnh,
      toDbPhanAnhStatus(trangThai),
      mucDo,
      maPhanAnh,
      parseInt(page),
      parseInt(size),
      sortTime,
      payload,
      sortBy,
      sortOrder,
      { idLinhVuc, startDate, endDate, khuPho, search },
    );
    return successResponse(
      res,
      data,
      "Lấy danh sách phản ánh thành công",
      pagination,
    );
  },

  async getLichSuTrangThaiPhanAnh(req, res) {
    const { idPhanAnh } = req.validatedParams;
    let result = await PhanAnhService.getLichSuTrangThaiPhanAnh(
      idPhanAnh,
      req.payload,
    );
    return successResponse(
      res,
      result,
      "Lấy lịch sử trạng thái phản ánh thành công",
    );
  },

  async getLichSuTrangThaiPhanAnhPublic(req, res) {
    const { maPhanAnh } = req.validatedParams;
    const result = await PhanAnhService.getLichSuTrangThaiPhanAnhPublic(
      maPhanAnh,
    );
    return successResponse(
      res,
      result,
      "Lấy lịch sử trạng thái phản ánh thành công",
    );
  },

  async getPhanAnhByUserId(req, res) {
    const currentUser = req.payload.userId;
    let { sortTime } = req.validatedQuery;
    let result = await PhanAnhService.getPhanAnhByUserId(currentUser, sortTime);
    return successResponse(
      res,
      result,
      "Lấy danh sách phản ánh của người dùng thành công",
    );
  },

  getMucDoPhanAnh(req, res) {
    let result = PhanAnhService.getMucDoPhanAnh();
    return successResponse(res, result, "Lấy mức độ phản ánh thành công");
  },

  getTrangThaiPhanAnh(req, res) {
    let result = PhanAnhService.getTrangThaiPhanAnh();
    return successResponse(res, result, "Lấy trạng thái phản ánh thành công");
  },

  async getPhanAnhById(req, res) {
    const { idPhanAnh } = req.validatedParams;
    let result = await PhanAnhService.getPhanAnhById(idPhanAnh, req.payload);
    return successResponse(res, result, "Lấy phản ánh thành công");
  },

  async updateStatusPhanAnh(req, res) {
    const { idPhanAnh } = req.validatedParams;
    const {
      trangThai,
      ghiChu,
      idVideoGiaiQuyet,
    } = req.body;
    const currentUser = req.payload.userId;
    const file = req.files;
    let result = await PhanAnhService.updateStatusPhanAnh(
      idPhanAnh,
      trangThai,
      ghiChu,
      currentUser,
      file,
      idVideoGiaiQuyet,
    );
    return successResponse(
      res,
      result,
      "Cập nhật trạng thái phản ánh thành công",
    );
  },

  async updateLinhVucPhanAnh(req, res) {
    const { idPhanAnh } = req.validatedParams;
    const { idLinhVucPhanAnh, lyDo } = req.body;
    const currentUser = req.payload.userId;
    let result = await PhanAnhService.updateLinhVucPhanAnh(
      idPhanAnh,
      idLinhVucPhanAnh,
      lyDo,
      currentUser,
    );
    return successResponse(
      res,
      result,
      "Cập nhật lĩnh vực phản ánh thành công",
    );
  },

  async exportPhanAnhExcel(req, res) {
    const buffer = await PhanAnhService.exportPhanAnhExcel({
      ...req.body,
      payload: req.payload,
    });
    const date = formatVietnamDate(new Date()) || new Date().toISOString().slice(0, 10);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="danh_sach_phan_anh_${date}.xlsx"`,
    );
    return res.send(Buffer.from(buffer));
  },

  async updateMucDoPhanAnh(req, res) {
    const { idPhanAnh } = req.validatedParams;
    const { mucDo, lyDo } = req.body;
    const currentUser = req.payload.userId;
    const result = await PhanAnhService.updateMucDoPhanAnh(
      idPhanAnh,
      mucDo,
      lyDo,
      currentUser,
    );
    return successResponse(res, result, "Cập nhật mức độ phản ánh thành công");
  },

  async getAssignableUsers(req, res) {
    const { idPhanAnh } = req.validatedParams;
    let result = await PhanAnhService.getAssignableUsers(idPhanAnh);
    return successResponse(
      res,
      result,
      "Lấy danh sách chuyên viên xử lý thành công",
    );
  },

  async assignPhanAnh(req, res) {
    const { idPhanAnh } = req.validatedParams;
    const { idNguoiXuLy, lyDo } = req.body;
    const currentUser = req.payload.userId;
    let result = await PhanAnhService.assignPhanAnh(
      idPhanAnh,
      idNguoiXuLy,
      lyDo,
      currentUser,
    );
    return successResponse(res, result, "Phân công xử lý phản ánh thành công");
  },

  async getTongQuanPhanAnh(req, res) {
    const { preset, startDate, endDate, khuPho, idLinhVuc } =
      req.validatedQuery;
    const payload = req.payload || {};
    let result = await PhanAnhService.getTongQuanPhanAnh({
      preset: preset || (startDate && endDate ? "custom" : "today"),
      startDate,
      endDate,
      khuPho,
      idLinhVuc,
      userId: payload.userId,
      permissions: payload.permissions,
      cate: payload.cate,
    });
    return successResponse(res, result, "Lấy tổng quát phản ánh thành công");
  },

  async getMucDoAndTrangThaiAndLinhVuc(req, res) {
    let result = await PhanAnhService.getMucDoAndTrangThaiAndLinhVuc();
    return successResponse(
      res,
      result,
      "Lấy mức độ và trạng thái, lĩnh vực phản ánh thành công",
    );
  },

  async searhByTieuDe(req, res) {
    const { search } = req.validatedQuery;
    let result = await PhanAnhService.searhByTieuDe(search);
    return successResponse(
      res,
      result,
      "Tìm kiếm phản ánh theo tiêu đề thành công",
    );
  },

  async createPhanAnhPublic(req, res) {
    let {
      idLinhVucPhanAnh,
      tieuDe,
      moTa,
      viTri,
      mucDo,
      tenNguoiPhanAnh,
      soDienThoaiNguoiPhanAnh,
      khuPho,
      moTaViTri,
      idVideo,
    } = req.body;
    const file = req.files;
    idVideo = parseStringToArray(idVideo);
    let result = await PhanAnhService.createPhanAnhPublic(
      idLinhVucPhanAnh,
      tieuDe,
      moTa,
      viTri,
      mucDo,
      tenNguoiPhanAnh,
      soDienThoaiNguoiPhanAnh,
      khuPho,
      moTaViTri,
      file,
      idVideo,
    );
    return successResponse(
      res,
      result,
      "Tạo phản ánh thành công",
    );
  },
};

export default PhanAnhController;
