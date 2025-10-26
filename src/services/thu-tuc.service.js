import ThuTucRepository from "../repositories/thu-tuc.repository.js";
import { BaseError } from "../utils/base-error.util.js";

const normalizeParam = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const ThuTucService = {
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
