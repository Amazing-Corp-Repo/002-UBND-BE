import PermissionRepository from "../repositories/permission.repository.js";
import RoleRepository from "../repositories/role.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { appendDeleteSuffixc, capitalizeWords } from "../utils/string.util.js";

const RoleService = {
  async createRole(name, description, permissionCodes, currentUser) {
    if (!permissionCodes || permissionCodes.length === 0) {
      throw new BaseError(400, "Phải có ít nhất một quyền cho vai trò");
    }
    name = capitalizeWords(name);
    const existingRole = await RoleRepository.findRoleByName(name);
    if (existingRole) {
      throw new BaseError(400, "Role đã tồn tại");
    }

    const existingPermissions = await PermissionRepository.findManyByCode(
      permissionCodes
    );
    if (existingPermissions.length !== permissionCodes.length) {
      throw new BaseError(400, "Một số quyền không tồn tại");
    }

    const roleData = {
      name,
      description,
      permissionCodes,
      nguoi_tao: currentUser,
    };

    return await RoleRepository.createRole(roleData);
  },

  async findAllRolesWithPagination(isActive, search, page, size) {
    let { data, totalItems } = await RoleRepository.findAllRolesWithPagination(
      isActive,
      search,
      page,
      size
    );
    let pagination = createPagination(page, size, totalItems);
    return { data, pagination };
  },

  async findAll(search) {
    return await RoleRepository.findAll(search);
  },

  async getRoleDetails(roleId) {
    let data = await RoleRepository.getRoleDetails(roleId);

    // Map type + description + grouping
    const permissions = data.permissions.map((rp) => {
      const parts = rp.code.split("_");
      const type = parts.slice(1).join("_");

      return {
        code: rp.code,
        description: rp.description,
        type,
      };
    });

    return {
      ...data,
      permissions: permissions,
    };
  },

  async updateStatus(roleId, isActive, currentUser) {
    let existingRole = await RoleRepository.getById(roleId);
    if (
      !existingRole ||
      existingRole.is_delete === true ||
      existingRole.name === "ADMIN"
    ) {
      throw new BaseError(404, "Role không tồn tại hoặc không thể thay đổi");
    }
    let linkedCount = await RoleRepository.countUserWithRole(roleId);
    if (linkedCount > 0 && isActive === false) {
      throw new BaseError(
        400,
        "Không thể vô hiệu hóa vai trò đang được sử dụng"
      );
    }

    let data = {
      is_active: isActive,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };

    return await RoleRepository.update(roleId, data);
  },

  async update(roleId, name, description, permissionCodes, currentUser) {
    if (!permissionCodes || permissionCodes.length === 0) {
      throw new BaseError(400, "Phải có ít nhất một quyền cho vai trò");
    }
    name = capitalizeWords(name);
    let existingRole = await RoleRepository.getById(roleId);
    if (!existingRole || existingRole.is_delete === true) {
      throw new BaseError(404, "Role không tồn tại");
    }
    if (existingRole.name === "ADMIN") {
      throw new BaseError(400, "Không thể chỉnh sửa vai trò ADMIN");
    }
    const roleWithSameName = await RoleRepository.findRoleByName(name);
    if (roleWithSameName && roleWithSameName.id !== roleId) {
      throw new BaseError(400, "Tên vai trò đã được sử dụng");
    }
    const existingPermissions = await PermissionRepository.findManyByCode(
      permissionCodes
    );
    if (existingPermissions.length !== permissionCodes.length) {
      throw new BaseError(400, "Một số quyền không tồn tại");
    }
    let data = {
      name,
      description,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };
    return await RoleRepository.updateAll(
      roleId,
      data,
      permissionCodes,
      currentUser
    );
  },

  async delete(roleId, currentUser) {
    let existingRole = await RoleRepository.getById(roleId);
    if (!existingRole || existingRole.is_delete === true) {
      throw new BaseError(404, "Role không tồn tại");
    }
    if (existingRole.is_active === true) {
      throw new BaseError(400, "Chỉ có thể xóa vai trò không hoạt động");
    }
    let data = {
      name: appendDeleteSuffixc(existingRole.name),
      is_delete: true,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };
    return await RoleRepository.update(roleId, data);
  },
};

export default RoleService;
