import CoSoDichVuCongRepository from "../repositories/co-so-dich-vu-cong.repository.js";
import UyBanRepository from "../repositories/uy-ban.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import ThuTucRepository from "../repositories/thu-tuc.repository.js";
import { appendDeleteSuffixc, capitalizeWords } from "../utils/string.util.js";

const CoSoDichCongService = {
    async getAll(isActive, search = "") {
        const result = await CoSoDichVuCongRepository.getAll(
            isActive,
            search ? capitalizeWords(search) : "",
        );

        return result;
    },

    async create(tenCoSo, diaChi, soDienThoai, moTa, linkGoogleMap, currentUser) {
        tenCoSo = capitalizeWords(tenCoSo);
        const existingCoSo = await CoSoDichVuCongRepository.findByName(tenCoSo);
        if (existingCoSo) {
            throw new BaseError(409, 'Cơ sở dịch vụ công với tên đã tồn tại');
        }

        let data = {
            ten_co_so: tenCoSo,
            dia_chi: diaChi,
            so_dien_thoai: soDienThoai,
            mo_ta: moTa,
            link_google_map: linkGoogleMap,
            nguoi_tao: currentUser
        };

        const result = await CoSoDichVuCongRepository.create(data);
        return result;
    },

    async findById(id) {
        if (id === undefined || id === null) {
            throw new BaseError(400, 'ID cơ sở dịch vụ công không được để trống');
        }
        const result = await CoSoDichVuCongRepository.findById(id);
        return result;
    },

    async update(id, tenCoSo, diaChi, soDienThoai, moTa, linkGoogleMap, currentUser) {
        if (id === undefined || id === null) {
            throw new BaseError(400, 'ID cơ sở dịch vụ công không được để trống');
        }
        tenCoSo = capitalizeWords(tenCoSo);
        const existingCoSo = await CoSoDichVuCongRepository.findById(id);
        if (!existingCoSo) {
            throw new BaseError(404, 'Cơ sở dịch vụ công không tồn tại');
        }

        const duplicateCoSo = await CoSoDichVuCongRepository.findByNameExcludeId(id, tenCoSo);
        if (duplicateCoSo) {
            throw new BaseError(409, 'Cơ sở dịch vụ công với tên đã tồn tại');
        }

        let data = {
            ten_co_so: tenCoSo,
            dia_chi: diaChi === undefined ? null : diaChi,
            so_dien_thoai: soDienThoai === undefined ? null : soDienThoai,
            mo_ta: moTa === undefined ? null : moTa,
            link_google_map: linkGoogleMap === undefined ? null : linkGoogleMap,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };

        const result = await CoSoDichVuCongRepository.update(id, data);
        return result;
    },

    async updateStatus(id, isActive, currentUser) {
        if (id === undefined || id === null) {
            throw new BaseError(400, 'ID cơ sở dịch vụ công không được để trống');
        }
        const existingCoSo = await CoSoDichVuCongRepository.findById(id);
        if (!existingCoSo) {
            throw new BaseError(404, 'Cơ sở dịch vụ công không tồn tại');
        }
        const relatedThuTuc = await ThuTucRepository.findByCoSoDichVuCongId(id);

        if (relatedThuTuc.length > 0 && !isActive) {
            throw new BaseError(400, 'Không thể vô hiệu hóa cơ sở dịch vụ công vì có thủ tục hành chính liên quan');
        }

        let data = {
            is_active: isActive,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };
        const result = await CoSoDichVuCongRepository.update(id, data);
        return result;
    },

    async delete(id, currentUser) {
        if (id === undefined || id === null) {
            throw new BaseError(400, 'ID cơ sở dịch vụ công không được để trống');
        }
        const existingCoSo = await CoSoDichVuCongRepository.findById(id);
        if (!existingCoSo) {
            throw new BaseError(404, 'Cơ sở dịch vụ công không tồn tại');
        }
        
        if (existingCoSo.is_active) {
            throw new BaseError(400, 'Chỉ có thể xóa cơ sở dịch vụ công đã bị vô hiệu hóa');
        }
        let data = {
            ten_co_so: appendDeleteSuffixc(existingCoSo.ten_co_so),
            is_delete: true,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };

        const result = await CoSoDichVuCongRepository.update(id, data);
        return result;
    }
};

export default CoSoDichCongService;