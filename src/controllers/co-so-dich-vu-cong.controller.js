import { successResponse } from "../utils/response.util.js";
import CoSoDichVuCongService from "../services/co-so-dich-vu-cong.service.js";

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return undefined;
};

const CoSoDichVuCongController = {
  async getAll(req, res) {
    const { isRemoved, search } = req.query;
    const isRemovedFilter = parseBoolean(isRemoved);
    const searchTerm =
      typeof search === "string" && search.trim() !== ""
        ? search.trim()
        : undefined;

    const result = await CoSoDichVuCongService.getAll(
      isRemovedFilter,
      searchTerm
    );
    console.log(result);

    return successResponse(res, result, "Lấy danh sách cơ sở dịch vụ công");
  },

  async getCoSoDichVuCongById(req, res) {
    const { id } = req.params;
    const facility = await CoSoDichVuCongService.getCoSoDichVuCongById(id);
    return successResponse(
      res,
      facility,
      "Lấy thông tin cơ sở dịch vụ thành công"
    );
  },

  async createCoSoDichVuCong(req, res) {
    const { idUyBan, tenCoSo, diaChi, soDienThoai, moTa, linkGoogleMap } =
      req.body;

    const newCoSo = await CoSoDichVuCongService.createCoSoDichVuCong(
      idUyBan,
      tenCoSo,
      diaChi,
      soDienThoai,
      moTa,
      linkGoogleMap
    );
    return successResponse(res, newCoSo, "Tạo cơ sở dịch vụ công thành công");
  },

  async updateCoSoDichVuCong(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const nguoiCapNhapId = req.user.id;

      const updatedCoSo = await CoSoDichVuCongService.updateCoSoDichVuCong(
        id,
        updateData,
        nguoiCapNhapId
      );
      return successResponse(
        res,
        updatedCoSo,
        "Cập nhật cơ sở dịch vụ thành công"
      );
    } catch (error) {
      next(error);
    }
  },

  async softDeleteCoSoDichVuCong(req, res, next) {
    try {
      const { id } = req.params;
      const nguoiCapNhapId = req.user.id;
      const deleted = await CoSoDichVuCongService.softDeleteCoSoDichVuCong(
        id,
        nguoiCapNhapId
      );
      return successResponse(res, deleted, "Xóa mềm cơ sở dịch vụ thành công");
    } catch (error) {
      next(error);
    }
  },
};

export default CoSoDichVuCongController;
