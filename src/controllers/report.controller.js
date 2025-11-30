import ReportService from "../services/report.service.js";
import { successResponse } from "../utils/response.util.js";

const ReportController = {
  async getReportPhanAnh(req, res) {
    const { from, to, id_linh_vuc } = req.query;
    let data = await ReportService.getReportPhanAnh(from, to, id_linh_vuc);
    return successResponse(res, data, "Lấy báo cáo phản ánh thành công");
  },

  async getReportThuTuc(req, res) {
    const { from, to } = req.query;
    let data = await ReportService.getReportThuTuc(from, to);
    return successResponse(res, data, "Lấy báo cáo thủ tục thành công");
  },

  async getReportTinTuc(req, res) {
    let { from, to } = req.query;
    let data = await ReportService.getReportTinTuc(from, to);
    return successResponse(res, data, "Lấy báo cáo tin tức thành công");
  },

  async exportReportPhanAnh(req, res) {
    const { from, to, idLinhVuc } = req.query;
    const buffer = await ReportService.exportReportPhanAnh(
      from,
      to,
      idLinhVuc
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bao_cao_phan_anh.xlsx"
    );
    return res.send(buffer);
  },

  async exportReportThuTuc(req, res) {
    const { from, to } = req.query;
    const buffer = await ReportService.exportReportThuTuc(from, to);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bao_cao_thu_tuc.xlsx"
    );
    return res.send(buffer);
  },

  async exportReportTinTuc(req, res) {
    const { from, to } = req.query;
    const buffer = await ReportService.exportReportTinTuc(from, to);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bao_cao_tin_tuc.xlsx"
    );
    return res.send(buffer);
  }
};

export default ReportController;
