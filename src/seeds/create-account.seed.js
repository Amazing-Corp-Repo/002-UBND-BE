import env from "../config/environment.config.js";
import UserRepository from "../repositories/user.repository.js";
import { hash } from "../utils/bcrypt.util.js";
import PermissionRepository from "../repositories/permission.repository.js";
import RoleRepository from "../repositories/role.repository.js";
import { PERMISSION } from "../constants/permission.constant.js";

export const CreateAccountSeed = async () => {
  const username = env.ADMIN_USERNAME;
  const password = env.ADMIN_PASSWORD;
  const email = env.ADMIN_EMAIL;

  await PermissionRepository.syncPermissions();

  let adminRole = await RoleRepository.findRoleByName("ADMIN");
  if (!adminRole) {
    const allPermissionCodes = Object.values(PERMISSION);
    adminRole = await RoleRepository.createRole({
      name: "ADMIN",
      description: "Quyền quản trị hệ thống",
      permissionCodes: allPermissionCodes,
      nguoi_tao: null,
    });
  } else {
    await RoleRepository.syncAdminRolePermissions(adminRole.id);
  }

  let user = await UserRepository.findUserByUsername(username);

  if (!user) {
    user = await UserRepository.createAdminAccount({
      ten_dang_nhap: username,
      mat_khau: await hash(password),
      email: email,
    });
  }

  const existAdminUserRole =
    await RoleRepository.findUserRolesByUserIdAndRoleId(user.id, adminRole.id);

  if (!existAdminUserRole) {
    await RoleRepository.assignRoleToUser(user.id, adminRole.id);
  }

  console.log(
    "Admin account have been created with username: ",
    username,
    " password: ",
    password
  );
};
