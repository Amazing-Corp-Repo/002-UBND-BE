import PermissionRepository from "../repositories/permission.repository.js";
import {
  PERMISSION,
  PERMISSION_DESC,
} from "../constants/permission.constant.js";

const PermissionService = {
  async getAllPermissions(search) {
    let data = Object.values(PERMISSION).map((code) => ({
      code,
      description: PERMISSION_DESC[code] || null,
    }));

    if (search) {
      const keyword = search.toLowerCase();
      data = data.filter((item) =>
        item.description?.toLowerCase().includes(keyword)
      );
    }

    const grouped = {};
    data.forEach((item) => {
      const prefix = item.code.split("_")[0];
      if (!grouped[prefix]) grouped[prefix] = [];
      grouped[prefix].push({
        description: item.description,
        code: item.code,
      });
    });

    return grouped;
  },
  async syncPermissions() {
    return await PermissionRepository.syncPermissions();
  },
};

export default PermissionService;
