import CoSoDichVuCongRepository from "../repositories/co-so-dich-vu-cong.repository.js";
import UyBanRepository from "../repositories/uy-ban.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import ThuTucRepository from "../repositories/thu-tuc.repository.js";
import e from "express";

const CoSoDichCongService = {
    async getAll(isRemoved, search = "") {
        const result = await CoSoDichVuCongRepository.getAll(
            isRemoved,
            search.toUpperCase(),
        );

        return result;
    },

    async create(idUyBan, tenCoSo, diaChi, soDienThoai, moTa, linkGoogleMap) {

        const existingCoSo = await CoSoDichVuCongRepository.findByName(tenCoSo);
        if (existingCoSo) {
            throw new BaseError(400, 'Cơ sở dịch vụ công với tên đã tồn tại');
        }
        const existingUyBan = await UyBanRepository.findById(idUyBan);
        if (!existingUyBan) {
            throw new BaseError(400, 'Ủy ban không tồn tại');
        }

        const result = await CoSoDichVuCongRepository.create(idUyBan, tenCoSo, diaChi, soDienThoai, moTa, linkGoogleMap);
        return result;
    },

    async findById(id) {
        const result = await CoSoDichVuCongRepository.findById(id);
        return result;
    },

    async update(id, idUyBan, tenCoSo, diaChi, soDienThoai, moTa, linkGoogleMap, isRemoved) {
        const existingCoSo = await CoSoDichVuCongRepository.findById(id);
        if (!existingCoSo) {
            throw new BaseError(404, 'Cơ sở dịch vụ công không tồn tại');
        }
        const existingUyBan = await UyBanRepository.findById(idUyBan);
        if (!existingUyBan) {
            throw new BaseError(400, 'Ủy ban không tồn tại');
        }
        const duplicateCoSo = await CoSoDichVuCongRepository.findByNameExcludeId(id, tenCoSo);
        if (duplicateCoSo) {
            throw new BaseError(400, 'Cơ sở dịch vụ công với tên đã tồn tại');
        }
        if (isRemoved === true) {
            const relatedThuTuc = await ThuTucRepository.findByCoSoDichVuCongId(id);
            
            if (relatedThuTuc.length > 0) {
                throw new BaseError(400, 'Không thể xóa cơ sở dịch vụ công vì có thủ tục hành chính liên quan');
            }
        }

        const result = await CoSoDichVuCongRepository.update(id, idUyBan, tenCoSo, diaChi, soDienThoai, moTa, linkGoogleMap, isRemoved);
        return result;
    },

    async delete(id) {
        const existingCoSo = await CoSoDichVuCongRepository.findById(id);
        if (!existingCoSo) {
            throw new BaseError(404, 'Cơ sở dịch vụ công không tồn tại');
        }
        const relatedThuTuc = await ThuTucRepository.findByCoSoDichVuCongId(id);
        if (relatedThuTuc.length > 0) {
            throw new BaseError(400, 'Không thể xóa cơ sở dịch vụ công vì có thủ tục hành chính liên quan');
        }
        if (existingCoSo.is_removed === false) {
            throw new BaseError(400, 'Cơ sở dịch vụ công phải được đánh dấu là đã xóa trước khi xóa vĩnh viễn');
        }
        const result = await CoSoDichVuCongRepository.delete(id);
        return result;
    }
};

export default CoSoDichCongService;