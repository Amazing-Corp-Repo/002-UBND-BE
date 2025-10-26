import ThuTucRepository from "../repositories/thu-tuc.repository.js";

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
};
export default ThuTucService;
