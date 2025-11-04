import MauDonRepository from "../repositories/mau-don.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { appendDeleteSuffixc, capitalizeWords } from "../utils/string.util.js";

const MauDonService = {
    async createMauDon(tenMauDon, moTa, maMauDon, file, currentUser) {
        if (!file || file.length === 0) {
            throw new BaseError(400, 'Vui lòng tải lên file mẫu đơn');
        }
        tenMauDon = capitalizeWords(tenMauDon);
        maMauDon = maMauDon?.toUpperCase();
        const existing = await MauDonRepository.findByNameOrCode(tenMauDon, maMauDon);
        if (existing) {
            throw new BaseError(409, `Tên mẫu đơn hoặc mã mẫu đơn đã được sử dụng`);
        }

        const firstFile = file?.[0];
        let data = {
            ten_mau_don: tenMauDon,
            mo_ta: moTa,
            ma_mau_don: maMauDon,
            url_file_pdf: firstFile.relativeUrl,
            kich_thuoc_file_mb: firstFile.sizeMB,
            nguoi_tao: currentUser,
        };
        return await MauDonRepository.createMauDon(data);
    },

    async updateMauDon(id, tenMauDon, moTa, maMauDon, file, currentUser) {
        tenMauDon = capitalizeWords(tenMauDon);
        maMauDon = maMauDon?.toUpperCase();
        const existing = await MauDonRepository.getMauDonById(id);
        if (!existing) {
            throw new BaseError(400, 'Mẫu đơn không tồn tại');
        }

        const conflict = await MauDonRepository.findByNameOrCodeExcludeId(id, tenMauDon, maMauDon);
        if (conflict) {
            throw new BaseError(409, `Tên mẫu đơn hoặc mã mẫu đơn đã được sử dụng`);
        }

        let data = {
            ten_mau_don: tenMauDon,
            mo_ta: moTa === undefined ? null : moTa,
            ma_mau_don: maMauDon === undefined ? null : maMauDon,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };

        if (file && file.length > 0) {
            const firstFile = file[0];
            data.url_file_pdf = firstFile.relativeUrl;
            data.kich_thuoc_file_mb = firstFile.sizeMB;
        }

        return await MauDonRepository.updateMauDon(id, data);
    },

    async getAllMauDon(isActive, search) {
        if (search) {
            search = capitalizeWords(search);
        }
        return await MauDonRepository.getAllMauDon(isActive, search);
    },

    async deleteMauDon(id, currentUser) {
        const existing = await MauDonRepository.getMauDonById(id);
        if (!existing) {
            throw new BaseError(404, 'Mẫu đơn không tồn tại');
        }
        if (existing.is_active) {
            throw new BaseError(400, 'Vui lòng thay đổi trang thái hoạt động mẫu đơn trước khi xoá');
        }
        let data = {
            is_delete: true,
            ten_mau_don: appendDeleteSuffixc(existing.ten_mau_don),
            ma_mau_don: appendDeleteSuffixc(existing.ma_mau_don),
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        };
        await MauDonRepository.updateMauDon(id, data);
    },

    async updateStatusMauDon(id, isActive, currentUser) {
        const existing = await MauDonRepository.getMauDonById(id);
        if (!existing) {
            throw new BaseError(404, 'Mẫu đơn không tồn tại');
        }
        if (isActive === false) {
            const isInUse = await MauDonRepository.checkMauDonInThuTuc(id);
            if (isInUse) {
                throw new BaseError(409, 'Mẫu đơn đang được sử dụng trong thủ tục, không thể thay đổi trạng thái');
            }
        }
        return await MauDonRepository.updateMauDon(id, {
            is_active: isActive,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString(),
        });
    }
};

export default MauDonService;