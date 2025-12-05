import AuditLogRepository from "../repositories/audit-log.repository.js";
import { createPagination } from "../utils/response.util.js";

const AuditLogService = {
  async fetchAllAuditLogs(page, size, fromRaw, toRaw, search) {

    const from = fromRaw ? toUTCFromVN_Start(fromRaw) : null;
    const to = toRaw ? toUTCFromVN_End(toRaw) : null;

    let {total, logs}  = await AuditLogRepository.getAllAuditLogs(page * 1, size * 1, from, to, search);

    for (let log of logs) {
      log.ten_nguoi_dung = log.nguoi_dung?.ho_va_ten || "N/A";
      for (let roleObj of log.nguoi_dung?.user_roles || []) {
        log.roles = log.roles || [];
        if (roleObj.roles && roleObj.roles.name) {
          log.roles.push(roleObj.roles.name);
        }
      }
      log.nguoi_dung = undefined;
    }
    const pagination = createPagination(page, size, total);

    return {
      data: logs,
      pagination
    };
  },

  async fetchAuditLogById(id) {
    let data = await AuditLogRepository.getAuditLogById(id);
    if (data) {
      data.ten_nguoi_dung = data.nguoi_dung?.ho_va_ten || "N/A";
      data.roles = [];
      for (let roleObj of data.nguoi_dung?.user_roles || []) {
        if (roleObj.roles && roleObj.roles.name) {
          data.roles.push(roleObj.roles.name);
        }
      }
      data.nguoi_dung = undefined;
      data.response_body = JSON.parse(data.response_body);
    }
    return data;
  },
};

export default AuditLogService;
