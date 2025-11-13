import DanhMucTinTucRepository from "../repositories/danh-muc-tin-tuc.repository.js";
import TinTucRepository from "../repositories/tin-tuc.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import { appendDeleteSuffixc, capitalizeWords } from "../utils/string.util.js";

const DanhMucTinTucService = {
    async create(tenDanhMuc, moTa, currentUser) {
        tenDanhMuc = capitalizeWords(tenDanhMuc);
        const existingDanhMuc = await DanhMucTinTucRepository.findByTenDanhMuc(tenDanhMuc);

        if (existingDanhMuc) {
            throw new BaseError(409, 'Danh mục tin tức đã tồn tại');
        }
        const data = {
            ten_danh_muc: tenDanhMuc,
            mo_ta: moTa,
            nguoi_tao: currentUser,
            thoi_gian_tao: new Date().toISOString(),
        };
        return DanhMucTinTucRepository.create(data);
    },


    async update(id, tenDanhMuc, moTa, currentUser) {
        if (id === null || id === undefined) {
            throw new BaseError(400, 'ID danh mục tin tức không được để trống');
        }
        tenDanhMuc = capitalizeWords(tenDanhMuc);
        const existingDanhMuc = await DanhMucTinTucRepository.findById(id);

        if (!existingDanhMuc) {
            throw new BaseError(404, 'Danh mục tin tức không tồn tại');
        }

        const duplicateDanhMuc = await DanhMucTinTucRepository.findByTenDanhMucExcludingId(id, tenDanhMuc);
        if (duplicateDanhMuc) {
            throw new BaseError(409, 'Tên danh mục tin tức đã được sử dụng');
        }


        const data = {
            ten_danh_muc: tenDanhMuc,
            mo_ta: moTa,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };

        return DanhMucTinTucRepository.update(id, data);
    },

    async delete(id, currentUser) {
        if (id === null || id === undefined) {
            throw new BaseError(400, 'ID danh mục tin tức không được để trống');
        }
        const existingDanhMuc = await DanhMucTinTucRepository.findById(id);
        if (!existingDanhMuc) {
            throw new BaseError(404, 'Danh mục tin tức không tồn tại');
        }
        if (existingDanhMuc.is_active === true) {
            throw new BaseError(400, 'Không thể xóa danh mục tin tức đang kích hoạt');
        }
        let data = {
            ten_danh_muc: appendDeleteSuffixc(existingDanhMuc.ten_danh_muc),
            is_delete: true,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };
        DanhMucTinTucRepository.update(id, data);
    },

    async findAll(isActive, search) {
        search = search ? capitalizeWords(search) : "";
        return await DanhMucTinTucRepository.findAll(isActive, search);
    },

    async findAllWithPagination(isActive, search, page, size) {
        search = search ? capitalizeWords(search) : "";
        let { data, totalItems } = await DanhMucTinTucRepository.findAllWithPagination(isActive, search, page, size);
        const pagination = createPagination(page, size, totalItems);
        return { data, pagination };
    },

    async findById(id) {
        if (id === null || id === undefined) {
            throw new BaseError(400, 'ID danh mục tin tức không được để trống');
        }
        return DanhMucTinTucRepository.findById(id);
    },

    async updateStatus(id, isActive, currentUser) {
        if (id === null || id === undefined) {
            throw new BaseError(400, 'ID danh mục tin tức không được để trống');
        }
        const existingDanhMuc = await DanhMucTinTucRepository.findById(id);
        if (!existingDanhMuc) {
            throw new BaseError(404, 'Danh mục tin tức không tồn tại');
        }
        const includeTinTuc = await TinTucRepository.findByIdDanhMuc(id);
        if (includeTinTuc && isActive === false) {
            throw new BaseError(400, 'Không thể gỡ bỏ danh mục tin tức đang được sử dụng');
        }
        const data = {
            is_active: isActive,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };
        return DanhMucTinTucRepository.update(id, data);
    }
};

export default DanhMucTinTucService;