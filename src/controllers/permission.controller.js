import PermissionService from "../services/permission.service.js";
import { successResponse } from "../utils/response.util.js";

const PermissionController = {
  async getAllPermissions(req, res) {
    let { search, danhMuc } = req.query;
    let result = await PermissionService.getAllPermissions(search, danhMuc);
    return successResponse(res, result, "Lấy danh sách quyền thành công");
  },

  async syncPermissions(req, res) {
    let result = await PermissionService.syncPermissions();
    return successResponse(res, result, "Đồng bộ quyền thành công");
  },

  getPermissionCategories(req, res) {
    let result = PermissionService.getPermissionCategories();
    return successResponse(res, result, "Lấy danh mục quyền thành công");
  },
};

export default PermissionController;
