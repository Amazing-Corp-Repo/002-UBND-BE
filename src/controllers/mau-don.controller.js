import MauDonService from "../services/mau-don.service.js";
import { successResponse } from "../utils/response.util.js";

const MauDonController = {
    async createMauDon(req, res) {
        let { tenMauDon, moTa, maMauDon } = req.body;
        const currentUser = req.payload.userId;
        let file = req.files;
        let result = await MauDonService.createMauDon(tenMauDon, moTa, maMauDon, file, currentUser);
        return successResponse(res, result, "Tạo mẫu đơn thành công");
    },

    async updateMauDon(req, res) {
        let { id } = req.params;
        let { tenMauDon, moTa, maMauDon, } = req.body;
        const currentUser = req.payload.userId;
        let file = req.files;
        let result = await MauDonService.updateMauDon(id, tenMauDon, moTa, maMauDon, file, currentUser);
        return successResponse(res, result, "Cập nhật mẫu đơn thành công");
    },

    async getAllMauDon(req, res) {
        let { isActive, search } = req.query;
        let result = await MauDonService.getAllMauDon(isActive, search);
        return successResponse(res, result, "Lấy danh sách mẫu đơn thành công");
    },

    async deleteMauDon(req, res) {
        let { id } = req.params;
        const currentUser = req.payload.userId;
        await MauDonService.deleteMauDon(id, currentUser);
        return successResponse(res, null, "Xóa mẫu đơn thành công");
    },

    async updateStatusMauDon(req, res) {
        let { id } = req.params;
        const currentUser = req.payload.userId;
        let { isActive } = req.body;
        let result = await MauDonService.updateStatusMauDon(id, isActive, currentUser);
        return successResponse(res, result, "Cập nhật trạng thái mẫu đơn thành công");
    },

    async getMauDonById(req, res) {
        let { id } = req.params;
        let result = await MauDonService.getMauDonById(id);
        return successResponse(res, result, "Lấy mẫu đơn thành công");
    },

    async getAllMauDonWithPaging(req, res) {
        let { page, size, isActive, search } = req.query;
        let { data, pagination } = await MauDonService.getAllMauDonWithPaging(page, size, isActive, search);
        return successResponse(res,data, "Lấy danh sách mẫu đơn thành công", pagination);
    },
};

export default MauDonController;