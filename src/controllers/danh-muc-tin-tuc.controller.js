import DanhMucTinTucService from "../services/danh-muc-tin-tuc.service.js";
import { BaseError } from "../utils/base-error.util.js";
import { successResponse } from "../utils/response.util.js";

const DanhMucTinTucController = {
    async create(req, res) {
        const { tenDanhMuc, moTa } = req.body;
        const currentUser = req.payload.userId;
        const result = await DanhMucTinTucService.create(tenDanhMuc, moTa, currentUser);
        return successResponse(res, result, 'Tạo danh mục tin tức thành công');
    },

    async update(req, res) {
        const { id } = req.params;
        const { tenDanhMuc, moTa } = req.body;
        const currentUser = req.payload.userId;
        const result = await DanhMucTinTucService.update(id, tenDanhMuc, moTa, currentUser);
        return successResponse(res, result, 'Cập nhật danh mục tin tức thành công');
    },

    async delete(req, res) {
        const { id } = req.params;
        const currentUser = req.payload.userId;
        const result = await DanhMucTinTucService.delete(id, currentUser);
        return successResponse(res, result, 'Xóa danh mục tin tức thành công');
    },

    async findAll(req, res) {
        const { isActive, search } = req.query;
        const result = await DanhMucTinTucService.findAll(isActive, search);
        return successResponse(res, result, 'Lấy danh sách danh mục tin tức thành công');
    },

    async findAllWithPagination(req, res) {
        const { isActive, search, page, size } = req.query;
        if (!page || !size) {
            throw new BaseError(400, 'Thiếu tham số phân trang: page và size là bắt buộc');
        }
        const result = await DanhMucTinTucService.findAllWithPagination(isActive, search, page * 1, size * 1);
        return successResponse(res, result.data, 'Lấy danh sách danh mục tin tức thành công', result.pagination);
    },

    async findById(req, res) {
        const { id } = req.params;
        const result = await DanhMucTinTucService.findById(id);
        return successResponse(res, result, 'Lấy danh mục tin tức thành công');
    },

    async updateStatus(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.payload.userId;
        const result = await DanhMucTinTucService.updateStatus(id, isActive, currentUser);
        return successResponse(res, result, 'Cập nhật trạng thái danh mục tin tức thành công');
    },

    async countTinTucByDanhMuc(req, res) {
        const result = await DanhMucTinTucService.countTinTucByDanhMuc();
        return successResponse(res, result, 'Đếm số lượng tin tức theo danh mục thành công');
    }
};

export default DanhMucTinTucController;