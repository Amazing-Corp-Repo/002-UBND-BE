import MauDonRepository from "../repositories/mau-don.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import FileService from "./file.service.js";

const MauDonService = {
    async createMauDon(tenMauDon, moTa, file) {
        if (!file || file.length === 0) {
            throw new BaseError(400, 'Vui lòng tải lên file mẫu đơn');
        }
        const firstFile = file?.[0];
        let data = {
            ten_mau_don: tenMauDon,
            mo_ta: moTa,
            url_file_pdf: firstFile.relativeUrl,
            kich_thuoc_file_mb: firstFile.sizeMB,
        };
        return await MauDonRepository.createMauDon(data);
    },

    async updateMauDon(id, tenMauDon, moTa, isRemoved, file) {
        const existing = await MauDonRepository.getMauDonById(id);
        if (!existing) {
            throw new BaseError('Mẫu đơn không tồn tại');
        }
        isRemoved = isRemoved === "true" ? true : isRemoved === "false" ? false : undefined;

        if (isRemoved === true) {
            const isInUse = await MauDonRepository.checkMauDonInThuTuc(id);
            if (isInUse) {
                throw new BaseError(400, 'Mẫu đơn đang được sử dụng trong thủ tục, không thể xóa');
            }
        }
        
        let data = {
            ten_mau_don: tenMauDon,
            mo_ta: moTa,
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
};

export default MauDonService;