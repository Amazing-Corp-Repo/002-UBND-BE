import AuditLogService from "../services/audit-log.service.js";
import { successResponse } from "../utils/response.util.js";

const AuditLogController = {
  async getAuditLogs(req, res) {
    let { page = 1, size = 10, from, to, search } = req.query;
    let { data, pagination } = await AuditLogService.fetchAllAuditLogs(
      page * 1,
      size * 1,
      from,
      to,
      search
    );
    return successResponse(
      res,
      data,
      "Lấy danh sách audit log thành công",
      pagination
    );
  },

  async getAuditLogById(req, res) {
    let { id } = req.params;
    let data = await AuditLogService.fetchAuditLogById(id);
    return successResponse(res, data, "Lấy chi tiết audit log thành công");
  },
};

export default AuditLogController;
