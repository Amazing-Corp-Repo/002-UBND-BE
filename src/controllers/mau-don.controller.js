import MauDonService from "../services/mau-don.service.js";
import { successResponse } from "../utils/response.util.js";


const MauDonController = {
    async createMauDon(req, res) {
        let { tenMauDon, moTa } = req.body;
        let file = req.files;
        let result = await MauDonService.createMauDon(tenMauDon, moTa, file);
        return successResponse(res, result, "Tạo mẫu đơn thành công");
    },

    async updateMauDon(req, res) {
        let { id } = req.params;
        let { tenMauDon, moTa, isRemoved } = req.body;
        let file = req.files;
        let result = await MauDonService.updateMauDon(id, tenMauDon, moTa, isRemoved, file);
        return successResponse(res, result, "Cập nhật mẫu đơn thành công");
    },

    async getAllMauDon(req, res) {
        let { isRemoved } = req.query;
        let result = await MauDonService.getAllMauDon(isRemoved);
        return successResponse(res, result, "Lấy danh sách mẫu đơn thành công");
    },

    async deleteMauDon(req, res) {
        let { id } = req.params;
        await MauDonService.deleteMauDon(id);
        return successResponse(res, null, "Xóa mẫu đơn thành công");
    }
};

export default MauDonController;