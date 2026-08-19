import ReceptionScheduleManagementService from "../services/reception-schedule-management.service.js";
import { successResponse } from "../utils/response.util.js";

const ReceptionScheduleManagementController = {
    async importLichTiepDan(req, res) {
        const file = req.files;
        const currentUser = req.payload.userId;
        const data = await ReceptionScheduleManagementService.handleImport(file, currentUser);
        return successResponse(res, data, "Import lịch tiếp dân thành công");
    },

    async getLichTiepDan(req, res) {
        const filters = req.validatedQuery;
        const data = await ReceptionScheduleManagementService.getLichTiepDan(filters);
        return successResponse(res, data, "Lấy danh sách lịch tiếp dân thành công");
    },

    async getLichTiepDanWithPagination(req, res) {
        const filters = req.validatedQuery;
        const data = await ReceptionScheduleManagementService.getLichTiepDanWithPagination(filters);
        return successResponse(res, data.data, "Lấy danh sách lịch tiếp dân thành công", data.pagination);
    },

    async countLichTiepDan(req, res) {
        const filters = req.query;
        const counts = await ReceptionScheduleManagementService.countLichTiepDan(filters);
        return successResponse(res, counts, "Đếm lịch tiếp dân thành công");
    },

    async deleteLichTiepDan(req, res) {
        const { id } = req.params;
        const currentUser = req.payload.userId;
        await ReceptionScheduleManagementService.deleteLichTiepDan(id, currentUser);
        return successResponse(res, null, "Xoá lịch tiếp dân thành công");
    },

    async updateStatusLichTiepDan(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.payload.userId;
        const data = await ReceptionScheduleManagementService.updateStatusLichTiepDan(id, isActive, currentUser);
        return successResponse(res, data, "Cập nhật lịch tiếp dân thành công");
    },

    async getTemplateLichTiepDan(req, res) {
        const relativeUrl = await ReceptionScheduleManagementService.getTemplateLichTiepDan();
        return successResponse(res, { relative_url: relativeUrl }, "Lấy template lịch tiếp dân thành công");
    },

    async getLichTiepDanById(req, res) {
        const { id } = req.params;
        const data = await ReceptionScheduleManagementService.getLichTiepDanById(id);
        return successResponse(res, data, "Lấy lịch tiếp dân theo ID thành công");
    },

    async createLichTiepDan(req, res) {
        const { tenCanBo, diaDiem, ngayTiepDan, batDau, ketThuc, workingPeriods, ghiChu } = req.body;
        const currentUser = req.payload.userId;
        const data = await ReceptionScheduleManagementService.createLichTiepDan(tenCanBo, diaDiem, ngayTiepDan, batDau, ketThuc, ghiChu, currentUser, workingPeriods);
        return successResponse(res, data, "Tạo lịch tiếp dân thành công");
    },

    async updateLichTiepDan(req, res) {
        const { id } = req.params;
        const { tenCanBo, diaDiem, ngayTiepDan, batDau, ketThuc, workingPeriods, ghiChu } = req.body;
        const currentUser = req.payload.userId;
        const data = await ReceptionScheduleManagementService.updateLichTiepDan(id, tenCanBo, diaDiem, ngayTiepDan, batDau, ketThuc, ghiChu, currentUser, workingPeriods);
        return successResponse(res, data, "Cập nhật lịch tiếp dân thành công");
    },
};

export default ReceptionScheduleManagementController;
