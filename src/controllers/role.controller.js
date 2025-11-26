import RoleService from "../services/role.service.js";
import { BaseError } from "../utils/base-error.util.js";
import { successResponse } from "../utils/response.util.js";

const RoleController = {
  async createRole(req, res) {
    const { name, description, permissionCodes } = req.body;
    const currentUser = req.payload.userId;
    const role = await RoleService.createRole(
      name,
      description,
      permissionCodes,
      currentUser
    );
    return successResponse(res, role, "Tạo vai trò thành công");
  },

  async findAllRolesWithPagination(req, res) {
    let { isActive, search, page, size } = req.query;
    if (!page || !size) {
      throw new BaseError(400, "Thiếu tham số page hoặc size");
    }
    const role = await RoleService.findAllRolesWithPagination(
      isActive,
      search,
      parseInt(page),
      parseInt(size)
    );
    return successResponse(
      res,
      role.data,
      "Lấy danh sách quyền thành công",
      role.pagination
    );
  },

  async findAll(req, res) {
    const { search } = req.query;
    const roles = await RoleService.findAll(search);
    return successResponse(res, roles, "Lấy danh sách vai trò thành công");
  },

  async getRoleDetails(req, res) {
    const { roleId } = req.params;
    const role = await RoleService.getRoleDetails(roleId);
    return successResponse(res, role, "Lấy chi tiết vai trò thành công");
  },

  async updateStatus(req, res) {
    const { roleId } = req.params;
    const { isActive } = req.body;
    const currentUser = req.payload.userId;
    const role = await RoleService.updateStatus(roleId, isActive, currentUser);
    return successResponse(res, role, "Cập nhật trạng thái vai trò thành công");
  },

  async update(req, res) {
    let { roleId } = req.params;
    let { name, description, permissionCodes } = req.body;
    const currentUser = req.payload.userId;
    const role = await RoleService.update(
      roleId,
      name,
      description,
      permissionCodes,
      currentUser
    );
    return successResponse(res, role, "Cập nhật vai trò thành công");
  },

  async delete(req, res) {
    let { roleId } = req.params;
    const currentUser = req.payload.userId;
    const role = await RoleService.delete(roleId, currentUser);
    return successResponse(res, role, "Xóa vai trò thành công");
  },
};
export default RoleController;
