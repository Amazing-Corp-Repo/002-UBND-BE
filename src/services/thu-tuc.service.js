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

        // Transform data để trả về format phù hợp
        return mauDonList.map(item => ({
            id: item.mau_don.id,
            ten_mau_don: item.mau_don.ten_mau_don,
            mo_ta: item.mau_don.mo_ta,
            url_file_pdf: item.mau_don.url_file_pdf,
            kich_thuoc_file_mb: item.mau_don.kich_thuoc_file_mb ? parseFloat(item.mau_don.kich_thuoc_file_mb) : null,
            ghi_chu: item.ghi_chu,
            so_luong_ban_chinh: item.so_luong_ban_chinh,
            so_luong_ban_sao: item.so_luong_ban_sao,
            thoi_gian_tao: item.mau_don.thoi_gian_tao
        }));
    }
};

export default ThuTucService;
