import PhanAnhService from "../services/phan-anh.service.js";
import { successResponse } from "../utils/response.util.js";

const PhanAnhController = {
    async createPhanAnh(req, res) {
        const {idLinhVucPhanAnh, tieuDe, moTa, viTri, mucDo, tenNguoiPhanAnh, soDienThoaiNguoiPhanAnh, userId  } = req.body;
        const file = req.files;
        let result = await PhanAnhService.createPhanAnh(idLinhVucPhanAnh, tieuDe, moTa, viTri, mucDo, tenNguoiPhanAnh, soDienThoaiNguoiPhanAnh, userId, file);
        return successResponse(res, result, "Tạo phản ánh thành công");
    },

    async getPhanAnhByMaPhanAnh(req, res) {
        const { maPhanAnh } = req.params;
        let result = await PhanAnhService.getPhanAnhByMaPhanAnh(maPhanAnh);
        return successResponse(res, result, "Lấy thông tin phản ánh thành công");
    },

    async getAllPhanAnh(req, res) {
        const { idLinhVucPhanAnh, trangThai, mucDo, maPhanAnh, page = 1, size = 10 } = req.query;
        let { data, pagination } = await PhanAnhService.getAll(idLinhVucPhanAnh, trangThai, mucDo, maPhanAnh, parseInt(page), parseInt(size));
        return successResponse(res, data, "Lấy danh sách phản ánh thành công", pagination);
    },

    async getLichSuTrangThaiPhanAnh(req, res) {
        const { idPhanAnh } = req.params;
        let result = await PhanAnhService.getLichSuTrangThaiPhanAnh(idPhanAnh);
        return successResponse(res, result, "Lấy lịch sử trạng thái phản ánh thành công");
    },

    async getPhanAnhByUserId(req, res) {
        const currentUser = req.payload.userId;
        let result = await PhanAnhService.getPhanAnhByUserId(currentUser);
        return successResponse(res, result, "Lấy danh sách phản ánh của người dùng thành công");
    },

    getMucDoPhanAnh(req, res) {
        let result = PhanAnhService.getMucDoPhanAnh();
        return successResponse(res, result, "Lấy mức độ phản ánh thành công");
    },

    getTrangThaiPhanAnh(req, res) {
        let result = PhanAnhService.getTrangThaiPhanAnh();
        return successResponse(res, result, "Lấy trạng thái phản ánh thành công");
    },

    async getPhanAnhById(req, res) {
        const { idPhanAnh } = req.params;
        let result = await PhanAnhService.getPhanAnhById(idPhanAnh);
        return successResponse(res, result, "Lấy phản ánh thành công");
    }
};

export default PhanAnhController;