import LinhVucPhanAnhRepository from "../repositories/linh-vuc-phan-anh.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { appendDeleteSuffixc, capitalizeWords } from "../utils/string.util.js";

const LinhVucPhanAnhService = {
    async createLinhVucPhanAnh(ten, moTa, currentUser) {
        ten = capitalizeWords(ten);
        const existingLinhVuc = await LinhVucPhanAnhRepository.findByName(ten);
        console.log(existingLinhVuc);
        if (existingLinhVuc) {
            throw new BaseError(409, 'Lĩnh vực phản ánh đã tồn tại');
        }
        const data = {
            ten,
            mo_ta: moTa,
            nguoi_tao: currentUser,
        };
        const result = await LinhVucPhanAnhRepository.create(data);
        return result;
    },

    async getAllLinhVucPhanAnh(page, size, search, isActive) {
        const { data, totalItems } = await LinhVucPhanAnhRepository.getAll(page, size, search, isActive);
        const pagination = createPagination(page, size, totalItems);
        return { data, pagination };
    },

    async updateLinhVucPhanAnh(id, ten, moTa, currentUser) {
        ten = capitalizeWords(ten);
        if (id === null || id === undefined) {
            throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
        }
        const existingLinhVuc = await LinhVucPhanAnhRepository.findById(id);
        if (!existingLinhVuc) {
            throw new BaseError(404, 'Lĩnh vực phản ánh không tồn tại');
        }
        const duplicateLinhVuc = await LinhVucPhanAnhRepository.findByNameExcludingId(id, ten);
        if (duplicateLinhVuc) {
            throw new BaseError(409, 'Lĩnh vực phản ánh đã tồn tại');
        }
        const data = {
            ten,
            mo_ta: moTa,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };
        const result = await LinhVucPhanAnhRepository.update(id, data);
        return result;
    },

    async updateLinhVucPhanAnhStatus(id, isActive, currentUser) {
        if (id === null || id === undefined) {
            throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
        }
        const existingLinhVuc = await LinhVucPhanAnhRepository.findById(id);
        if (!existingLinhVuc) {
            throw new BaseError(404, 'Lĩnh vực phản ánh không tồn tại');
        }
        if (isActive === false) {
            const activeReflections = await LinhVucPhanAnhRepository.countActiveReflections(id);
            if (activeReflections > 0) {
                throw new BaseError(400, 'Không thể vô hiệu hóa lĩnh vực phản ánh vì còn phản ánh đang hoạt động liên quan');
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
        if (id === null || id === undefined) {
            throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
        }
        const result = await LinhVucPhanAnhRepository.findById(id);
        if (!result) {
            throw new BaseError(404, 'Lĩnh vực phản ánh không tồn tại');
        }
        return result;
    },

    async deleteLinhVucPhanAnh(id, currentUser) {
        if (id === null || id === undefined) {
            throw new BaseError(400, "ID lĩnh vực phản ánh không được để trống");
        }
        const existingLinhVuc = await LinhVucPhanAnhRepository.findById(id);
        if (!existingLinhVuc) {
            throw new BaseError(404, 'Lĩnh vực phản ánh không tồn tại');
        }
        if (existingLinhVuc.is_active) {
            throw new BaseError(400, 'Chỉ có lĩnh vực phản ánh không hoạt động mới có thể xóa');
        }
        const activeReflections = await LinhVucPhanAnhRepository.countActiveReflectionsToDelete(id);
        if (activeReflections > 0) {
            throw new BaseError(400, 'Không thể xóa lĩnh vực phản ánh vì còn phản ánh liên quan');
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
    }
};

export default LinhVucPhanAnhService;