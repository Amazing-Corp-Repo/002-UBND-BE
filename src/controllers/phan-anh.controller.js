import PhanAnhService from "../services/phan-anh.service.js";
import { successResponse } from "../utils/response.util.js";
import { parseStringToArray } from "../utils/string.util.js";

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
      userId,
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
      userId,
      file,
      idVideo,
    );
    return successResponse(res, result, "Tạo phản ánh thành công");
  },

  async getPhanAnhByMaPhanAnh(req, res) {
    const { maPhanAnh } = req.params;
    let result = await PhanAnhService.getPhanAnhByMaPhanAnh(maPhanAnh);
    return successResponse(res, result, "Lấy thông tin phản ánh thành công");
  },

  async getAllPhanAnh(req, res) {
    const {
      idLinhVucPhanAnh,
      trangThai,
      mucDo,
      maPhanAnh,
      page = 1,
      size = 10,
      sortTime,
    } = req.query;
    const payload = req.payload;
    let { data, pagination } = await PhanAnhService.getAll(
      idLinhVucPhanAnh,
      trangThai,
      mucDo,
      maPhanAnh,
      parseInt(page),
      parseInt(size),
      sortTime,
      payload,
    );
    return successResponse(
      res,
      data,
      "Lấy danh sách phản ánh thành công",
      pagination,
    );
  },

  async getLichSuTrangThaiPhanAnh(req, res) {
    const { idPhanAnh } = req.params;
    let result = await PhanAnhService.getLichSuTrangThaiPhanAnh(idPhanAnh);
    return successResponse(
      res,
      result,
      "Lấy lịch sử trạng thái phản ánh thành công",
    );
  },

  async getPhanAnhByUserId(req, res) {
    const currentUser = req.payload.userId;
    let { sortTime } = req.query;
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
    const { idPhanAnh } = req.params;
    let result = await PhanAnhService.getPhanAnhById(idPhanAnh);
    return successResponse(res, result, "Lấy phản ánh thành công");
  },

  async updateStatusPhanAnh(req, res) {
    const { idPhanAnh } = req.params;
    const { thoiGianPhanHoiDuKien, ngayDuKienHoanThanh, trangThai, ghiChu } =
      req.body;
    const currentUser = req.payload.userId;
    let result = await PhanAnhService.updateStatusPhanAnh(
      idPhanAnh,
      thoiGianPhanHoiDuKien,
      ngayDuKienHoanThanh,
      trangThai,
      ghiChu,
      currentUser,
    );
    return successResponse(
      res,
      result,
      "Cập nhật trạng thái phản ánh thành công",
    );
  },

  async getTongQuanPhanAnh(req, res) {
    let result = await PhanAnhService.getTongQuanPhanAnh();
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
    const { search } = req.query;
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
