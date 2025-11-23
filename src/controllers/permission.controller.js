import PermissionService from "../services/permission.service.js";
import { successResponse } from "../utils/response.util.js";

const PermissionController = {
  async getAllPermissions(req, res) {
    let { search } = req.query;
    let result = await PermissionService.getAllPermissions(search);
    return successResponse(res, result, "Lấy danh sách quyền thành công");
  },

  async syncPermissions(req, res) {
    let result = await PermissionService.syncPermissions();
    return successResponse(res, result, "Đồng bộ quyền thành công");
  },
};

export default PermissionController;
