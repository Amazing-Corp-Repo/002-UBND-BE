import LinhVucRepository from "../repositories/linh-vuc.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { capitalizeWords } from "../utils/string.util.js";

const LinhVucService = {
    async getAll(is_removed, searchTerm) {
        searchTerm = searchTerm ? capitalizeWords(searchTerm) : "";
        const linhVucs = await LinhVucRepository.getAll(is_removed, searchTerm);
        return linhVucs;
    },

    async create(ten_linh_vuc, mo_ta) {
        const normalizedName = capitalizeWords(ten_linh_vuc);
        const existing = await LinhVucRepository.findByTenLinhVuc(normalizedName, false);
        if (existing) {
            throw new BaseError(400, "Tên lĩnh vực đã tồn tại");
        }

        const newLinhVuc = await LinhVucRepository.create(normalizedName, mo_ta);
        return newLinhVuc;
    },

    async update(id, ten_linh_vuc, mo_ta, is_remove, nguoi_cap_nhap) {
        // Kiểm tra lĩnh vực có tồn tại không
        const existing = await LinhVucRepository.findById(id);
        if (!existing) {
            throw new BaseError(404, "Không tìm thấy lĩnh vực để cập nhật");
        }

        const normalizedName = capitalizeWords(ten_linh_vuc);
        const duplicate = await LinhVucRepository.findByTenLinhVucExcludeId(normalizedName, id, false);
        if (duplicate) {
            throw new BaseError(400, "Tên lĩnh vực đã tồn tại trong lĩnh vực khác");
        }
        if (is_remove === true) {
            const linkedCount = await LinhVucRepository.countThuTucLinks(id);
            if (linkedCount > 0) {
                throw new BaseError(400, "Không thể đánh dấu xóa lĩnh vực này. Vẫn còn thủ tục đang liên quan đến lĩnh vực này");
            }
        }

        const updatedLinhVuc = await LinhVucRepository.update(id, normalizedName, mo_ta, is_remove, nguoi_cap_nhap);
        return updatedLinhVuc;
    },

    async hardDelete(id) {
        const existing = await LinhVucRepository.findById(id);
        if (!existing) {
            throw new BaseError(404, "Không tìm thấy lĩnh vực để xóa");
        }

        if (existing.is_remove === false) {
            throw new BaseError(400, "Chỉ được xóa cứng lĩnh vực đã được đánh dấu xóa mềm");
        }

        const linkedCount = await LinhVucRepository.countThuTucLinks(id);
        if (linkedCount > 0) {
            throw new BaseError(400, "Không thể xóa cứng. Vẫn còn thủ tục đang liên quan đến lĩnh vực này");
        }

        await LinhVucRepository.hardDelete(id);
        return null;
    },
};

export default LinhVucService;