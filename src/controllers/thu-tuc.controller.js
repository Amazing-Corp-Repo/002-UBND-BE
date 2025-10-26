
import { successResponse } from '../utils/response.util.js'; 
import ThuTucService from '../services/thu-tuc.service.js'; 

const ThuTucController = {
    async getThuTucBasicDetails(req, res) {
        const { id } = req.params; // Lấy ID thủ tục từ URL params
        const procedure = await ThuTucService.getThuTucBasicDetails(id); // Gọi service để lấy dữ liệu
        return successResponse(res, procedure, 'Lấy thông tin thủ tục thành công'); // Trả về phản hồi thành công
    },

    async getAllThuTuc(req, res) {
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 10;
    const { procedures, pagination } = await ThuTucService.getAllThuTuc(page, size);
return successResponse(res, procedures, 'Lấy danh sách thủ tục thành công', pagination);

    },

    async getFullThuTucDetails(req, res) {
        const { id } = req.params; // Lấy ID thủ tục từ URL params
        const procedure = await ThuTucService.getFullProcedureDetails(id); 
        return successResponse(res, procedure, 'Lấy thông tin chi tiết đầy đủ thủ tục thành công'); 
    },
};

export default ThuTucController;