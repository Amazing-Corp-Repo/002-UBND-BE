import UyBanService from "../services/uy-ban.service.js";
import { successResponse } from "../utils/response.util.js";

const UyBanController = {
    async create(req, res) {
        const { tenDonVi, diaChi, soDienThoai, email, gioLamViec, linkGoogleMap } = req.body;
        const newUyBan = await UyBanService.create(tenDonVi, diaChi, soDienThoai, email, gioLamViec, linkGoogleMap);
        return successResponse(res, newUyBan, 'Tạo ủy ban thành công');
    },

    async getFrist(req, res) {
        const uyBans = await UyBanService.getFrist();
        return successResponse(res, uyBans, 'Lấy danh ủy ban thành công');
    },

    async update(req, res) {
        const { id } = req.params;
        const { tenDonVi, diaChi, soDienThoai, email, gioLamViec, linkGoogleMap } = req.body;
        const updatedUyBan = await UyBanService.update(id, tenDonVi, diaChi, soDienThoai, email, gioLamViec, linkGoogleMap);
        return successResponse(res, updatedUyBan, 'Cập nhật ủy ban thành công');
    }
};

export default UyBanController;