import PermissionRepository from "../repositories/permission.repository.js";
import {
  PERMISSION,
  PERMISSION_CATEGORIES,
  PERMISSION_DESC,
  PERMISSION_TYPE,
} from "../constants/permission.constant.js";

const PermissionService = {
  async getAllPermissions(search, danhMuc) {
    let data = Object.values(PERMISSION).map((code) => {
      const parts = code.split("_");
      const type = parts.slice(1).join("_");
      return {
        code,
        description: PERMISSION_DESC[code] || null,
        type,
      };
    });

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

      grouped[prefix].push(item);
    });
    let cate = PERMISSION_CATEGORIES;
    let type = PERMISSION_TYPE;
    
    return { grouped, cate, type };
  },
  async syncPermissions() {
    return await PermissionRepository.syncPermissions();
  },

  getPermissionCategories() {
    return PERMISSION_CATEGORIES;
  },
};

export default PermissionService;
