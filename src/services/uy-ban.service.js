import UyBanRepository from "../repositories/uy-ban.repository.js";
import { BaseError } from "../utils/base-error.util.js";

const UyBanService = {
    async create(tenDonVi, diaChi, soDienThoai, email, gioLamViec, linkGoogleMap) {
        const existingUyBan = await UyBanRepository.findFirst();
        if (existingUyBan) {
            throw new BaseError(400,'Đã có ủy ban trong hệ thống');
        }
        const data = {
            ten_don_vi: tenDonVi,
            dia_chi_tru_so: diaChi,
            so_dien_thoai: soDienThoai,
            email: email,
            gio_lam_viec: gioLamViec,
            link_google_map: linkGoogleMap
        };
        return await UyBanRepository.create(data);
    },

    async getFrist() {
        return await UyBanRepository.findFirst();
    },

    async update(id, tenDonVi, diaChi, soDienThoai, email, gioLamViec, linkGoogleMap) {
        const uyBan = await UyBanRepository.findById(id);
        if (!uyBan) {
            throw new BaseError(404, 'Ủy ban không tồn tại');
        }
        const updateData = {
            ten_don_vi: tenDonVi,
            dia_chi_tru_so: diaChi,
            so_dien_thoai: soDienThoai,
            email: email,
            gio_lam_viec: gioLamViec,
            link_google_map: linkGoogleMap
        };
        return await UyBanRepository.update(id, updateData);
    },
}

export default UyBanService;