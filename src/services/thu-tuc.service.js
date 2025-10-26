import { BaseError } from "../utils/base-error.util.js";
import ThuTucRepository from "../repositories/thu-tuc.repository.js";
import { createPagination } from "../utils/response.util.js";

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

  async getAllThuTuc(page, size) {
    const { procedures, total } =
      await ThuTucRepository.getAllThuTucWithBasicDetails(page, size);
    const pagination = createPagination(page, size, total);
    return { procedures, pagination };
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
};

export default ThuTucService;
