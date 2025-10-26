import ThuTucRepository from "../repositories/thu-tuc.repository.js";
import { BaseError } from "../utils/base-error.util.js";

const ThuTucService = {
    /**
     * Lấy danh sách mẫu đơn theo id thủ tục
     * @param {string} thuTucId - ID của thủ tục hành chính
     * @returns {Promise<Array>} Danh sách mẫu đơn kèm thông tin chi tiết
     */
    async getMauDonByThuTucId(thuTucId) {
        // Kiểm tra thủ tục có tồn tại không
        const exists = await ThuTucRepository.exists(thuTucId);
        if (!exists) {
            throw new BaseError(404, "Không tìm thấy thủ tục hành chính");
        }

        // Lấy danh sách mẫu đơn
        const mauDonList = await ThuTucRepository.getMauDonByThuTucId(thuTucId);

        return mauDonList;
    }
};

export default ThuTucService;
