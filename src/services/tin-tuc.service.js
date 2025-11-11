import TinTucRepository from "../repositories/tin-tuc.repository.js";
import DinhKemTinTucRepository from "../repositories/dinh-kem-tin-tuc.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import DanhMucTinTucRepository from "../repositories/danh-muc-tin-tuc.repository.js";
import { capitalizeWords } from "../utils/string.util.js";

const TinTucService = {
    async uploadFile(idTinTuc, file = [], currentUser) {
        if (!file || file.length === 0) {
            throw new BaseError(400, 'File đính kèm là bắt buộc');
        }
        if (!idTinTuc || idTinTuc === '') {
            const tinTuc = await TinTucRepository.create({
                is_active: false,
                nguoi_tao: currentUser,
            });
            idTinTuc = tinTuc.id;
        }
        let data = {
            id_tin_tuc: idTinTuc,
            url_file: file[0].relativeUrl,
            kich_thuoc_file_mb: file[0].sizeMB,
            dinh_dang_file: file[0].mimetype,
            nguoi_tao: currentUser,
        };

        const result = await DinhKemTinTucRepository.create(data);
        return {
            id_tin_tuc: result.id_tin_tuc,
            url_file: result.url_file
        };
    },

    async updateTinTuc(id, idDanhMuc, tieuDe, noiDung, tacGia, isActive, file = [], currentUser) {
        if (id === null || id === undefined) {
            throw new BaseError(400, 'ID tin tức không được để trống');
        }
        tieuDe = capitalizeWords(tieuDe);
        tacGia = tacGia ? capitalizeWords(tacGia) : tacGia;
        const exsitsting = await TinTucRepository.findById(id);
        if (!exsitsting) {
            throw new BaseError(404, 'Tin tức không tồn tại');
        }

        const existingDanhMuc = await DanhMucTinTucRepository.findById(idDanhMuc);
        if (!existingDanhMuc || existingDanhMuc.is_active === false) {
            throw new BaseError(404, 'Danh mục tin tức không tồn tại');
        }
        let data = {
            tac_gia: tacGia,
            id_danh_muc: idDanhMuc,
            tieu_de: tieuDe,
            noi_dung: noiDung,
            is_active: isActive,
            is_noti: exsitsting.is_noti,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };

        if (file && file.length > 0) {
            data.url_anh_dai_dien = file[0].relativeUrl;
        };
        if (exsitsting.is_active === false && isActive === true && !exsitsting.is_noti) {
            const hasNewImage = data.url_anh_dai_dien && data.url_anh_dai_dien.trim() !== '';
            const hasOldImage = exsitsting.url_anh_dai_dien && exsitsting.url_anh_dai_dien.trim() !== '';

            if (!hasNewImage && !hasOldImage) {
                throw new BaseError(400, 'Ảnh đại diện tin tức là bắt buộc để xuất bản tin tức');
            }

            // Gửi thông báo xuất bản tin tức
            data.is_noti = true;
        }
        const result = await TinTucRepository.update(id, data);
        return result;
    },

    async getDetails(id) {
        if (!id === null || id === undefined) {
            throw new BaseError(400, 'ID tin tức không được để trống');
        }
        const result = await TinTucRepository.getDetails(id);
        return result;
    },

    async getAll(page, size, idDanhMuc, isActive, search) {
        const { data, totalItems } = await TinTucRepository.getAll(page, size, idDanhMuc, isActive, search);
        const pagination = createPagination(page, size, totalItems);
        return { data, pagination };
    },

    async delete(id, currentUser) {
        if (!id === null || id === undefined) {
            throw new BaseError(400, 'ID tin tức không được để trống');
        }
        const existing = await TinTucRepository.findById(id);
        if (!existing) {
            throw new BaseError(404, 'Tin tức không tồn tại');
        }
        if (existing.is_active) {
            throw new BaseError(400, 'Chỉ có tin tức đang hoạt động mới có thể xóa');
        }

        let data = {
            is_delete: true,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        }

        await TinTucRepository.update(id, data);
    },

    async createTinTuc(idDanhMuc, tieuDe, noiDung, isActive, tacGia, file, currentUser) {
        tieuDe = capitalizeWords(tieuDe);
        tacGia = tacGia ? capitalizeWords(tacGia) : tacGia;

        const existingDanhMuc = await DanhMucTinTucRepository.findById(idDanhMuc, false);
        if (!existingDanhMuc) {
            throw new BaseError(404, 'Danh mục tin tức không tồn tại');
        }

        let data = {
            id_danh_muc: idDanhMuc,
            tieu_de: tieuDe,
            noi_dung: noiDung,
            is_active: isActive,
            tac_gia: tacGia,
            nguoi_tao: currentUser,
        };

        if (file && file.length > 0) {
            data.url_anh_dai_dien = file[0].relativeUrl;
        }
        if (isActive === true) {
            if (data.url_anh_dai_dien == null || data.url_anh_dai_dien === '') {
                throw new BaseError(400, 'Ảnh đại diện tin tức là bắt buộc để xuất bản tin tức');
            }
            // Gửi thông báo xuất bản tin tức

            data.is_noti = true;
        }
        console.log(data);
        return await TinTucRepository.create(data);

    },

    async updateTinTucStatus(id, isActive, currentUser) {
        if (id === null || id === undefined) {
            throw new BaseError(400, 'ID tin tức không được để trống');
        }
        const existing = await TinTucRepository.findById(id);
        if (!existing) {
            throw new BaseError(404, 'Tin tức không tồn tại');
        }
        const data = {
            is_active: isActive,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };
        return await TinTucRepository.update(id, data);
    }

};

export default TinTucService;