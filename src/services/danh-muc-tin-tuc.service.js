import DanhMucTinTucRepository from "../repositories/danh-muc-tin-tuc.repository.js";
import { BaseError } from "../utils/base-error.util.js";

const DanhMucTinTucService = {
    async create(tenDanhMuc, moTa) {
        const existingDanhMuc = await DanhMucTinTucRepository.findByTenDanhMuc(tenDanhMuc, false);

        if (existingDanhMuc) {
            throw new BaseError(400, 'Danh mục tin tức đã tồn tại');
        }
        const data = {
            ten_danh_muc: tenDanhMuc,
            mo_ta: moTa
        };
        return DanhMucTinTucRepository.create(data);
    },


    async update (id, tenDanhMuc, moTa, isRemoved) {
        const existingDanhMuc = await DanhMucTinTucRepository.findById(id);

        if (!existingDanhMuc) {
            throw new BaseError(404, 'Danh mục tin tức không tồn tại');
        }

        if (isRemoved == false && existingDanhMuc.is_removed == true) {
            const checkTenDanhMuc = await DanhMucTinTucRepository.findByTenDanhMuc(tenDanhMuc, false);
            if (checkTenDanhMuc) {
                throw new BaseError(400, 'Danh mục tin tức đã tồn tại');
            }
        }

        const data = {
            ten_danh_muc: tenDanhMuc,
            mo_ta: moTa,
            is_removed: isRemoved
        };

        return DanhMucTinTucRepository.update(id, data);
    },

    async delete(id) {
        const existingDanhMuc = await DanhMucTinTucRepository.findById(id);
        if (!existingDanhMuc) {
            throw new BaseError(404, 'Danh mục tin tức không tồn tại');
        }
        if (existingDanhMuc.is_removed == false) {
            throw new BaseError(400, 'Chỉ được xóa danh mục tin tức đã bị gỡ bỏ');
        }
        return DanhMucTinTucRepository.delete(id);
    },

    async findAll(isRemoved) {
        return DanhMucTinTucRepository.findAll(isRemoved);
    },

    async findById(id) {
        return DanhMucTinTucRepository.findById(id);
    }
};

export default DanhMucTinTucService;