import LinhVucRepository from "../repositories/linh-vuc.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { appendDeleteSuffixc, capitalizeWords } from "../utils/string.util.js";

const LinhVucService = {
    async getAll(isActive, searchTerm) {
        searchTerm = searchTerm ? capitalizeWords(searchTerm) : "";
        const linhVucs = await LinhVucRepository.getAll(isActive, searchTerm);
        return linhVucs;
    },

    async create(tenLinhVuc, moTa, currentUser) {
        const normalizedName = capitalizeWords(tenLinhVuc);
        const existing = await LinhVucRepository.findByTenLinhVuc(normalizedName);
        if (existing) {
            throw new BaseError(409, "Tên lĩnh vực đã tồn tại");
        }
        let data = {
            ten_linh_vuc: normalizedName,
            mo_ta: moTa,
            nguoi_tao: currentUser,
        }
        const newLinhVuc = await LinhVucRepository.create(data);
        return newLinhVuc;
    },

    async update(id, tenLinhVuc, moTa, currentUser) {
        if (id === null || id === undefined) {
            throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
        }
        // Kiểm tra lĩnh vực có tồn tại không
        const existing = await LinhVucRepository.findById(id);
        if (!existing) {
            throw new BaseError(404, "Không tìm thấy lĩnh vực để cập nhật");
        }
        const normalizedName = capitalizeWords(tenLinhVuc);
        const duplicate = await LinhVucRepository.findByTenLinhVucExcludeId(normalizedName, id);
        if (duplicate) {
            throw new BaseError(409, "Tên lĩnh vực đã tồn tại");
        }
        let data = {
            ten_linh_vuc: normalizedName,
            mo_ta: moTa,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        }
        const updatedLinhVuc = await LinhVucRepository.update(id, data);
        return updatedLinhVuc;
    },

    async updateStatus(id, isActive, currentUser) {
        if (id === null || id === undefined) {
            throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
        }
        const existing = await LinhVucRepository.findById(id);
        if (!existing) {
            throw new BaseError(404, "Không tìm thấy lĩnh vực để cập nhật trạng thái");
        }
        const linkedCount = await LinhVucRepository.countThuTucLinks(id);

        if (isActive === false && linkedCount > 0) {
            throw new BaseError(400, "Không thể vô hiệu hóa lĩnh vực. Vẫn còn thủ tục đang liên quan đến lĩnh vực này");
        }

        const updatedLinhVuc = await LinhVucRepository.update(id, {
            is_active: isActive,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        });
        return updatedLinhVuc;
    },

    async delete(id, currentUser) {
        if (id === null || id === undefined) {
            throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
        }
        const existing = await LinhVucRepository.findById(id);
        if (!existing) {
            throw new BaseError(404, "Không tìm thấy lĩnh vực để xóa");
        }

        if (existing.is_active) {
            throw new BaseError(400, "Không thể xóa lĩnh vực đang hoạt động. Vui lòng vô hiệu hóa lĩnh vực trước khi xóa.");
        }

        let data = {
            ten_linh_vuc: appendDeleteSuffixc(existing.ten_linh_vuc),
            is_delete: true,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        }
        await LinhVucRepository.update(id, data);
    },

    async getLinhVucById(id) {
        if (id === null || id === undefined) {
            throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
        }
        const linhVuc = await LinhVucRepository.findById(id);
        if (!linhVuc || linhVuc.is_delete) {
            throw new BaseError(404, "Lĩnh vực không tồn tại");
        }
        return linhVuc;
    }
};

export default LinhVucService;