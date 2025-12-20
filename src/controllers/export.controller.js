import ExportService from "../services/export.service.js";
import { BaseError } from "../utils/base-error.util.js";
import { successResponse } from "../utils/response.util.js";
import path from "path";
import fs from "fs";

const ExportController = {
  async exportPhanAnhToZip(req, res) {
    const { from, to, email } = req.query;
    await ExportService.exportPhanAnhToZip(from, to, email);
    return successResponse(
      res,
      null,
      "Yêu cầu xuất phản ánh đã được tiếp nhận và đang xử lý."
    );
  },

  async getExportPhanAnhList(req, res) {
    const exports = await ExportService.getExportPhanAnhList();
    return successResponse(res, exports);
  },

  async downloadExportPhanAnh(req, res) {
    const exportDir = path.resolve("src/public/export/phan-anh");
    const { fileName } = req.params;

    const safeName = path.basename(fileName);
    const fullPath = path.join(exportDir, safeName);

    if (!fs.existsSync(fullPath)) {
      throw new BaseError(404, "File export không tồn tại");
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);

    const stream = fs.createReadStream(fullPath);

    stream.on("error", (err) => {
      console.error("Download export error:", err);
      throw new BaseError(500, "Lỗi khi tải file export");
    });

    return stream.pipe(res);
  },

  async deleteExport(req, res) {
    const exportDir = path.resolve("src/public/export/phan-anh");
    const { fileName } = req.params; // <-- params, không phải query

    const safeName = path.basename(fileName);
    const fullPath = path.join(exportDir, safeName);

    if (!fs.existsSync(fullPath)) {
      throw new BaseError(404, "File export không tồn tại");
    }

    try {
      await fs.promises.unlink(fullPath);
    } catch (err) {
      console.error("Delete export error:", err);
      throw new BaseError(500, "Lỗi khi xóa file export");
    }

    return successResponse(
      res,
      { deleted: true },
      "Xóa export phản ánh thành công"
    );
  },
};

export default ExportController;
