import TinTucRepository from "../repositories/tin-tuc.repository.js";
import DinhKemTinTucRepository from "../repositories/dinh-kem-tin-tuc.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import TIN_TUC from "../constants/tin-tuc.constant.js";
import FileService from "./file.service.js";
import { createPagination } from "../utils/response.util.js";
import DanhMucTinTucRepository from "../repositories/danh-muc-tin-tuc.repository.js";
import { capitalizeWords } from "../utils/string.util.js";

const TinTucService = {
    async uploadFile(idTinTuc, file = []) {
        if (!file || file.length === 0) {
            throw new BaseError(400, 'File đính kèm là bắt buộc');
        }
        if (!idTinTuc) {
            const tinTuc = await TinTucRepository.create({
                trang_thai: TIN_TUC.NHAP,
            });
            idTinTuc = tinTuc.id;
        }
        let data = {
            id_tin_tuc: idTinTuc,
            url_file: file[0].relativeUrl,
            kich_thuoc_file_mb: file[0].sizeMB,
            dinh_dang_file: file[0].mimetype,
        };

        const result = await DinhKemTinTucRepository.create(data);
        return {
            id_tin_tuc: result.id_tin_tuc,
            url_file: result.url_file
        };
    },

    async updateTinTuc(id, idDanhMuc, tieuDe, noiDung, trangThai, tacGia, isRemoved, file = []) {
        tieuDe = capitalizeWords(tieuDe);
        tacGia = tacGia ? capitalizeWords(tacGia) : tacGia;
        const exsitsting = await TinTucRepository.findById(id);
        if (!exsitsting) {
            throw new BaseError(404, 'Tin tức không tồn tại');
        }

        const existingDanhMuc = await DanhMucTinTucRepository.findById(idDanhMuc, false);
        if (!existingDanhMuc) {
            throw new BaseError(404, 'Danh mục tin tức không tồn tại');
        }
        let data = {
            tac_gia: tacGia,
            id_danh_muc: idDanhMuc,
            tieu_de: tieuDe,
            noi_dung: noiDung,
            trang_thai: trangThai,
            is_noti: exsitsting.is_noti,
            is_removed: isRemoved
        };

        if (file && file.length > 0) {
            data.url_anh_dai_dien = file[0].relativeUrl;
            if (exsitsting.url_anh_dai_dien) {
                FileService.deleteFile(exsitsting.url_anh_dai_dien);
            }
        };
        if (exsitsting.trang_thai === TIN_TUC.NHAP && trangThai === TIN_TUC.XUAT_BAN && !exsitsting.is_noti) {
            if (data.url_anh_dai_dien == null || data.url_anh_dai_dien === '') {
                throw new BaseError(400, 'Ảnh đại diện tin tức là bắt buộc để xuất bản tin tức');
            }
            // Gửi thông báo xuất bản tin tức
            data.is_noti = true;
        }

        const result = await TinTucRepository.update(id, data);
        return result;
    },

    async getDetails(id) {
        const result = await TinTucRepository.getDetails(id);
        return result;
    },

    async getAll(page, size, idDanhMuc, isRemoved) {
        const { data, totalItems } = await TinTucRepository.getAll(page, size, idDanhMuc, isRemoved);
        const pagination = createPagination(page, size, totalItems);
        return { data, pagination };
    },

    async delete(id) {
        const existing = await TinTucRepository.findById(id);
        if (!existing) {
            throw new BaseError(404, 'Tin tức không tồn tại');
        }
        if (!existing.is_removed) {
            throw new BaseError(400, 'Chỉ có thể xóa tin tức đã được đánh dấu là đã xóa');
        }

        const attachments = await DinhKemTinTucRepository.getDinhKemByTinTucId(id);

        await TinTucRepository.delete(id, true);

        if (existing.url_anh_dai_dien) {
            FileService.deleteFile(existing.url_anh_dai_dien);
        }

        for (const attachment of attachments) {
            FileService.deleteFile(attachment.url_file);
        }
    },

    async createTinTuc(idDanhMuc, tieuDe, noiDung, trangThai, tacGia, file) {
        tieuDe = capitalizeWords(tieuDe);
        tacGia = tacGia ? capitalizeWords(tacGia) : tacGia;
        if (!file || file.length === 0) {
            throw new BaseError(400, 'Ảnh đại diện tin tức là bắt buộc');
        }

        const existingDanhMuc = await DanhMucTinTucRepository.findById(idDanhMuc, false);
        if (!existingDanhMuc) {
            throw new BaseError(404, 'Danh mục tin tức không tồn tại');
        }

        let data = {
            id_danh_muc: idDanhMuc,
            tieu_de: tieuDe,
            noi_dung: noiDung,
            trang_thai: trangThai,
            tac_gia: tacGia,
        };
        if (file && file.length > 0) {
            data.url_anh_dai_dien = file[0].relativeUrl;
        }
        if (trangThai === TIN_TUC.XUAT_BAN) {
            if (data.url_anh_dai_dien == null || data.url_anh_dai_dien === '') {
                throw new BaseError(400, 'Ảnh đại diện tin tức là bắt buộc để xuất bản tin tức');
            }
            // Gửi thông báo xuất bản tin tức

            data.is_noti = true;
        }

        return await TinTucRepository.create(data);

    }

};

export default TinTucService;