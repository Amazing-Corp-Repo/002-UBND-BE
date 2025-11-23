import PermissionRepository from "../repositories/permission.repository.js";

const PermissionService = {
  async getAllPermissions(search) {
    const data = await PermissionRepository.getAllPermissions(search);

    const grouped = {};

    data.forEach((item) => {
      const prefix = item.code.split("_")[0]; // Lấy UY, TT, CSV, ...
      if (!grouped[prefix]) {
        grouped[prefix] = [];
      }
      item.code = undefined;
      grouped[prefix].push(item);
    });

    return grouped;
  },
  async syncPermissions() {
    return await PermissionRepository.syncPermissions();
  },
};

export default PermissionService;
