import PermissionRepository from "../repositories/permission.repository.js";
import {
  PERMISSION,
  PERMISSION_CATEGORIES,
  PERMISSION_DESC,
} from "../constants/permission.constant.js";

const PermissionService = {
  async getAllPermissions(search, danhMuc) {
    let data = Object.values(PERMISSION).map((code) => ({
      code,
      description: PERMISSION_DESC[code] || null,
    }));

    if (danhMuc) {
      data = data.filter((item) => item.code.startsWith(`${danhMuc}_`));
    }

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
        code: item.code,
        description: item.description,
      });
    });

    return grouped;
  },
  async syncPermissions() {
    return await PermissionRepository.syncPermissions();
  },

  getPermissionCategories() {
    return PERMISSION_CATEGORIES;
  },
};

export default PermissionService;
