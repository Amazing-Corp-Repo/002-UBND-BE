import MauDonRepository from "../repositories/mau-don.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { capitalizeWords } from "../utils/string.util.js";
import FileService from "./file.service.js";

const MauDonService = {
    async createMauDon(tenMauDon, moTa, maMauDon, file) {
        if (!file || file.length === 0) {
            throw new BaseError(400, 'Vui lòng tải lên file mẫu đơn');
        }
        tenMauDon = capitalizeWords(tenMauDon);
        maMauDon = maMauDon.toUpperCase();
        const existing = await MauDonRepository.findByNameOrCode(tenMauDon, maMauDon);
        if (existing) {
            throw new BaseError(400, `Tên mẫu đơn hoặc mã mẫu đơn đã được sử dụng`);
        }

        const firstFile = file?.[0];
        let data = {
            ten_mau_don: tenMauDon,
            mo_ta: moTa,
            ma_mau_don: maMauDon.toUpperCase(),
            url_file_pdf: firstFile.relativeUrl,
            kich_thuoc_file_mb: firstFile.sizeMB,
        };
        return await MauDonRepository.createMauDon(data);
    },

    async updateMauDon(id, tenMauDon, moTa, isRemoved, file) {
        tenMauDon = capitalizeWords(tenMauDon);
        maMauDon = maMauDon.toUpperCase();
        const existing = await MauDonRepository.getMauDonById(id);
        if (!existing) {
            throw new BaseError(400, 'Mẫu đơn không tồn tại');
        }

        const conflict = await MauDonRepository.findByNameOrCodeExcludeId(id, tenMauDon, maMauDon);
        if (conflict) {
            throw new BaseError(400, `Tên mẫu đơn hoặc mã mẫu đơn đã được sử dụng`);
        }

        isRemoved = isRemoved === "true" ? true : isRemoved === "false" ? false : undefined;

        if (isRemoved === true) {
            const isInUse = await MauDonRepository.checkMauDonInThuTuc(id);
            if (isInUse) {
                throw new BaseError(400, 'Mẫu đơn đang được sử dụng trong thủ tục, không thể xóa');
            }
        }

        if (isRemoved === false && existing.is_removed) {
            const maMauDonConflict = await MauDonRepository.getMauDonByMaMauDon(existing.ma_mau_don);
            if (maMauDonConflict && maMauDonConflict.id !== id) {
                throw new BaseError(400, `Mã mẫu đơn ${existing.ma_mau_don} đã được sử dụng`);
            }
        }

        let data = {
            ten_mau_don: tenMauDon,
            mo_ta: moTa,
            ma_mau_don: maMauDon,
            is_removed: isRemoved,
        };

        if (file && file.length > 0) {
            const firstFile = file[0];
            data.url_file_pdf = firstFile.relativeUrl;
            data.kich_thuoc_file_mb = firstFile.sizeMB;

            if (existing.url_file_pdf) {
                await FileService.deleteFile(existing.url_file_pdf);
            }
        }

        return await MauDonRepository.updateMauDon(id, data);
    },

    async getAllMauDon(is_removed, search) {
        if (search) {
            search = capitalizeWords(search);
        }
        return await MauDonRepository.getAllMauDon(is_removed, search);
    },

    async deleteMauDon(id) {
        const existing = await MauDonRepository.getMauDonById(id);
        if (!existing) {
            throw new BaseError('Mẫu đơn không tồn tại');
        }
        const isInUse = await MauDonRepository.checkMauDonInThuTuc(id);
        if (isInUse) {
            throw new BaseError(400, 'Mẫu đơn đang được sử dụng trong thủ tục, không thể xóa');
        }
        if (!existing.is_removed) {
            throw new BaseError(400, 'Vui lòng đánh dấu mẫu đơn là đã xóa trước khi xoá vĩnh viễn');
        }
        if (existing.url_file_pdf) {
            await FileService.deleteFile(existing.url_file_pdf);
        }
        await MauDonRepository.deleteMauDon(id);
    }
};

export default MauDonService;