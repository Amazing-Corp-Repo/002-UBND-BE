import TinTucService from "../services/tin-tuc.service.js";
import { successResponse } from "../utils/response.util.js";

const TinTucController = {
    async uploadFile(req, res) {
        const { idTinTuc } = req.body;
        const file = req.files;
        const result = await TinTucService.uploadFile(idTinTuc, file);
        return successResponse(res, result, 'Tải lên file tin tức thành công');
    },

    async updateTinTuc(req, res) {
        const { id } = req.params;
        let { idDanhMuc, tieuDe, noiDung, trangThai, tacGia, isRemoved } = req.body;
        isRemoved = isRemoved === 'true' ? true : false;
        let file = req.files;
        const result = await TinTucService.updateTinTuc(id, idDanhMuc, tieuDe, noiDung, trangThai, tacGia, isRemoved, file);
        return successResponse(res, result, 'Cập nhật tin tức thành công');
    },

    async getDetails(req, res) {
        const { id } = req.params;
        const result = await TinTucService.getDetails(id);
        return successResponse(res, result, 'Lấy chi tiết tin tức thành công');
    },

    async getAll(req, res) {
        const { page = 1, size = 10, idDanhMuc, isRemoved } = req.query;
        const result = await TinTucService.getAll(parseInt(page), parseInt(size), idDanhMuc, isRemoved);
        return successResponse(res, result.data, 'Lấy danh sách tin tức thành công', result.pagination);
    },

    async delete(req, res) {
        const { id } = req.params;
        await TinTucService.delete(id);
        return successResponse(res, null, 'Xóa tin tức thành công');
    },

    async create(req, res) {
        const { idDanhMuc, tieuDe, noiDung, trangThai, tacGia } = req.body;
        const file = req.files;
        const result = await TinTucService.createTinTuc(idDanhMuc, tieuDe, noiDung, trangThai, tacGia, file);
        return successResponse(res, result, 'Tạo tin tức thành công');
    }
};

export default TinTucController;