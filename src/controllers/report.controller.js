import ReportService from "../services/report.service.js";
import { successResponse } from "../utils/response.util.js";


const ReportController = {
    async getBaoCaoTongHop(req, res) {
        const { from, to } = req.query;
        let data = await ReportService.getBaoCaoTongHop(from, to);
        return successResponse(res, data, "Lấy báo cáo tổng hợp thành công");
    },

    async exportBaoCaoTongHopExcel(req, res) {
        const { from, to } = req.query;
        const excelBuffer = await ReportService.exportBaoCaoTongHopExcel(from, to);

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=bao-cao-tong-hop.xlsx");

        return res.send(excelBuffer);
    },

    async getBaoCaoLinhVuc(req, res) {
        const { from, to } = req.query;
        let data = await ReportService.getBaoCaoLinhVuc(from, to);
        return successResponse(res, data, "Lấy báo cáo lĩnh vực thành công");
    },

    async exportBaoCaoLinhVucExcel(req, res) {
        const { from, to } = req.query;
        const excelBuffer = await ReportService.exportBaoCaoLinhVucExcel(from, to);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=bao-cao-linh-vuc.xlsx");
        return res.send(excelBuffer);
    },

    async getBaoCaoTrangThai(req, res) {
        const { from, to } = req.query;
        let data = await ReportService.getBaoCaoTrangThai(from, to);
        return successResponse(res, data, "Lấy báo cáo đơn vị thành công");
    },

    async exportgetBaoCaoTrangThaiExcel(req, res) {
        const { from, to } = req.query;
        const excelBuffer = await ReportService.exportBaoCaoTrangThaiExcel(from, to);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=bao-cao-trang-thai.xlsx");
        return res.send(excelBuffer);
    }
};

export default ReportController;