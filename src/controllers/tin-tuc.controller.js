import TinTucService from "../services/tin-tuc.service.js";
import { successResponse } from "../utils/response.util.js";

const TinTucController = {
    async uploadFile(req, res) {
        const { idTinTuc } = req.body;
        const currentUser = req.payload.userId;
        const file = req.files;
        const result = await TinTucService.uploadFile(idTinTuc, file, currentUser);
        return successResponse(res, result, 'Tải lên file tin tức thành công');
    },

    async updateTinTuc(req, res) {
        const { id } = req.params;
        let { idDanhMuc, tieuDe, noiDung, tacGia, isActive } = req.body;
        isActive = isActive === 'true' ? true : false;
        let file = req.files;
        const currentUser = req.payload.userId;
        const result = await TinTucService.updateTinTuc(id, idDanhMuc, tieuDe, noiDung, tacGia, isActive, file, currentUser);
        return successResponse(res, result, 'Cập nhật tin tức thành công');
    },

    async getDetails(req, res) {
        const { id } = req.params;
        const result = await TinTucService.getDetails(id);
        return successResponse(res, result, 'Lấy chi tiết tin tức thành công');
    },

    async getAll(req, res) {
        const { page = 1, size = 10, idDanhMuc, isActive, search } = req.query;
        const result = await TinTucService.getAll(parseInt(page), parseInt(size), idDanhMuc, isActive, search);
        return successResponse(res, result.data, 'Lấy danh sách tin tức thành công', result.pagination);
    },

    async delete(req, res) {
        const { id } = req.params;
        const currentUser = req.payload.userId;
        await TinTucService.delete(id, currentUser);
        return successResponse(res, null, 'Xóa tin tức thành công');
    },

    async create(req, res) {
        let { idDanhMuc, tieuDe, noiDung, isActive, tacGia } = req.body;
        const file = req.files;
        const currentUser = req.payload.userId;
        isActive = isActive === 'true' ? true : false;
        const result = await TinTucService.createTinTuc(idDanhMuc, tieuDe, noiDung, isActive, tacGia, file, currentUser);
        return successResponse(res, result, 'Tạo tin tức thành công');
    },

    async updateStatus(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.payload.userId;
        const result = await TinTucService.updateTinTucStatus(id, isActive, currentUser);
        return successResponse(res, result, 'Cập nhật trạng thái tin tức thành công');
    }
};

export default TinTucController;