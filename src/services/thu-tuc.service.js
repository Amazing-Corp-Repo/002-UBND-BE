import { BaseError } from "../utils/base-error.util.js";
import ThuTucRepository from "../repositories/thu-tuc.repository.js";
import { createPagination } from "../utils/response.util.js";

const normalizeParam = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const ThuTucService = {
  async getThuTucBasicDetails(procedureId) {
    const procedure = await ThuTucRepository.getThuTucById(procedureId);

    if (!procedure || procedure.is_removed) {
      console.warn(
        `[WARN] ${new Date().toISOString()} - Thủ tục với ID ${procedureId} không tìm thấy hoặc đã bị xóa`
      );
      throw new BaseError(400, "Thủ tục hành chính không tìm thấy");
    }

    return procedure;
  },

  async getFullProcedureDetails(procedureId) {
    const procedure = await ThuTucRepository.getThuTucAllDetails(procedureId);

    if (!procedure || procedure.is_removed) {
      console.warn(
        `[WARN] ${new Date().toISOString()} - Thủ tục với ID ${procedureId} không tìm thấy hoặc đã bị xóa (chi tiết đầy đủ).`
      );
      throw new BaseError(
        400,
        "Thủ tục hành chính không tìm thấy hoặc đã bị xóa"
      );
    }
    return procedure;
  },
  
  async searchThuTuc(filters = {}) {
    const normalizedKeyword = normalizeParam(filters.keyword);
    const normalizedLinhVucId = normalizeParam(filters.linhVucId);

    if (!normalizedKeyword && !normalizedLinhVucId) {
      return ThuTucRepository.getAllThuTuc();
    }

    return ThuTucRepository.searchThuTuc({
      keyword: normalizedKeyword,
      linhVucId: normalizedLinhVucId,
    });
  },
  
  async getMauDonByThuTucId(thuTucId) {
        // Kiểm tra thủ tục có tồn tại không
        const exists = await ThuTucRepository.exists(thuTucId);
        if (!exists) {
            throw new BaseError(404, "Không tìm thấy thủ tục hành chính");
        }

        // Lấy danh sách mẫu đơn
        const mauDonList = await ThuTucRepository.getMauDonByThuTucId(thuTucId);

        return mauDonList;
    },
};

export default ThuTucService;
