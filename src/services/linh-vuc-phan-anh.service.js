import LinhVucPhanAnhRepository from "../repositories/linh-vuc-phan-anh.repository.js";
import UserRepository from "../repositories/user.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { appendDeleteSuffixc, capitalizeWords } from "../utils/string.util.js";

const LinhVucPhanAnhService = {
  async createLinhVucPhanAnh(ten, moTa, nguoiQuanLyIds, currentUser) {
    if (nguoiQuanLyIds && nguoiQuanLyIds.length > 0) {
      const validCount = await UserRepository.countUserByIds(nguoiQuanLyIds);
      if (validCount !== nguoiQuanLyIds.length) {
        throw new BaseError(
          400,
          "Danh sách người quản lý không hợp lệ: tồn tại userId không tồn tại"
        );
      }
    } else {
      throw new BaseError(400, "Danh sách người quản lý không được để trống");
    }

    ten = capitalizeWords(ten);
    const existingLinhVuc = await LinhVucPhanAnhRepository.findByName(ten);
    if (existingLinhVuc) {
      throw new BaseError(409, "Lĩnh vực phản ánh đã tồn tại");
    }
    const result = await LinhVucPhanAnhRepository.createWithManagers(
      { ten, moTa, currentUser },
      nguoiQuanLyIds
    );
    return result;
  },

  async getAllLinhVucPhanAnh(page, size, search, isActive) {
    const { data, totalItems } = await LinhVucPhanAnhRepository.getAll(
      page,
      size,
      search,
      isActive
    );
    const pagination = createPagination(page, size, totalItems);
    return { data, pagination };
  },

  async updateLinhVucPhanAnh(id, ten, moTa, nguoiQuanLyIds, currentUser) {
    if (nguoiQuanLyIds && nguoiQuanLyIds.length > 0) {
      const validCount = await UserRepository.countUserByIds(nguoiQuanLyIds);
      if (validCount !== nguoiQuanLyIds.length) {
        throw new BaseError(
          400,
          "Danh sách người quản lý không hợp lệ: tồn tại userId không tồn tại"
        );
      }
    } else {
      throw new BaseError(400, "Danh sách người quản lý không được để trống");
    }

    ten = capitalizeWords(ten);
    if (id === null || id === undefined) {
      throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
    }
    const existingLinhVuc = await LinhVucPhanAnhRepository.findById(id);
    if (!existingLinhVuc) {
      throw new BaseError(404, "Lĩnh vực phản ánh không tồn tại");
    }
    const duplicateLinhVuc =
      await LinhVucPhanAnhRepository.findByNameExcludingId(id, ten);
    if (duplicateLinhVuc) {
      throw new BaseError(409, "Lĩnh vực phản ánh đã tồn tại");
    }
    const data = {
      ten,
      mo_ta: moTa,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };
    const result = await LinhVucPhanAnhRepository.updateWithManagers(id, data, nguoiQuanLyIds, currentUser);
    return result;
  },

  async updateLinhVucPhanAnhStatus(id, isActive, currentUser) {
    if (id === null || id === undefined) {
      throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
    }
    const existingLinhVuc = await LinhVucPhanAnhRepository.findById(id);
    if (!existingLinhVuc) {
      throw new BaseError(404, "Lĩnh vực phản ánh không tồn tại");
    }
    if (isActive === false) {
      const activeReflections =
        await LinhVucPhanAnhRepository.countActiveReflections(id);
      if (activeReflections > 0) {
        throw new BaseError(
          400,
          "Không thể vô hiệu hóa lĩnh vực phản ánh vì còn phản ánh đang hoạt động liên quan"
        );
      }
    }
    const data = {
      is_active: isActive,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };
    const result = await LinhVucPhanAnhRepository.update(id, data);
    return result;
  },

  async getLinhVucPhanAnhById(id) {
    if (!id) {
      throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
    }

    const raw = await LinhVucPhanAnhRepository.findById(id);

    if (!raw) {
      throw new BaseError(404, "Lĩnh vực phản ánh không tồn tại");
    }

    const managers = raw.linh_vuc_phan_anh_nguoi_quan_ly.map((m) => {
      const user =
        m.nguoi_dung_linh_vuc_phan_anh_nguoi_quan_ly_id_nguoi_dungTonguoi_dung;

      return {
        id: user?.id,
        ho_va_ten: user?.ho_va_ten,
        email: user?.email,
        so_dien_thoai: user?.so_dien_thoai,
      };
    });

    return {
      id: raw.id,
      ten: raw.ten,
      mo_ta: raw.mo_ta,
      is_active: raw.is_active,
      nguoi_tao: raw.nguoi_tao,
      thoi_gian_tao: raw.thoi_gian_tao,
      nguoi_cap_nhat: raw.nguoi_cap_nhat,
      thoi_gian_cap_nhat: raw.thoi_gian_cap_nhat,

      nguoi_quan_ly: managers,
    };
  },

  async deleteLinhVucPhanAnh(id, currentUser) {
    if (id === null || id === undefined) {
      throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
    }
    const existingLinhVuc = await LinhVucPhanAnhRepository.findById(id);
    if (!existingLinhVuc) {
      throw new BaseError(404, "Lĩnh vực phản ánh không tồn tại");
    }
    if (existingLinhVuc.is_active) {
      throw new BaseError(
        400,
        "Chỉ có lĩnh vực phản ánh không hoạt động mới có thể xóa"
      );
    }
    const activeReflections =
      await LinhVucPhanAnhRepository.countActiveReflectionsToDelete(id);
    if (activeReflections > 0) {
      throw new BaseError(
        400,
        "Không thể xóa lĩnh vực phản ánh vì còn phản ánh liên quan"
      );
    }
    const data = {
      ten: appendDeleteSuffixc(existingLinhVuc.ten),
      is_delete: true,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    };
    const result = await LinhVucPhanAnhRepository.update(id, data);
    return result;
  },

  async searchLinhVucPhanAnhByName(ten) {
    const results = await LinhVucPhanAnhRepository.searchByName(ten);
    return results;
  },
};

export default LinhVucPhanAnhService;
