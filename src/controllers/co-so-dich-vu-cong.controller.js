import CoSoDichVuCongService from "../services/co-so-dich-cong.service.js";
import { successResponse } from "../utils/response.util.js";

const CoSoDichVuCongController = {
    async getAll(req, res) {
        const { isRemoved, search } = req.query;
        const searchTerm =
            typeof search === "string" && search.trim() !== ""
                ? search.trim()
                : undefined;

        const result = await CoSoDichVuCongService.getAll(
            isRemoved,
            searchTerm
        );
        return successResponse(res, result, "Lấy danh sách cơ sở dịch vụ công");
    },

    async create(req, res) {
        const {
            idUyBan,
            tenCoSo,
            diaChi,
            soDienThoai,
            moTa,
            linkGoogleMap
        } = req.body;
        const result = await CoSoDichVuCongService.create(
            idUyBan,
            tenCoSo,
            diaChi,
            soDienThoai,
            moTa,
            linkGoogleMap
        );
        return successResponse(res, result, "Tạo mới cơ sở dịch vụ công thành công");
    },

    async findById(req, res) {
        const { id } = req.params;
        const result = await CoSoDichVuCongService.findById(id);
        return successResponse(res, result, "Lấy cơ sở dịch vụ công theo ID");
    },

    async update(req, res) {
        const { id } = req.params;
        const {
            idUyBan,
            tenCoSo,
            diaChi,
            soDienThoai,
            moTa,
            linkGoogleMap,
            isRemoved
        } = req.body;
        const result = await CoSoDichVuCongService.update(
            id,
            idUyBan,
            tenCoSo,
            diaChi,
            soDienThoai,
            moTa,
            linkGoogleMap,
            isRemoved
        );
        return successResponse(res, result, "Cập nhật cơ sở dịch vụ công thành công");
    },

    async delete(req, res) {
        const { id } = req.params;
        await CoSoDichVuCongService.delete(id);
        return successResponse(res, null, "Xóa cơ sở dịch vụ công thành công");
    }
};


export default CoSoDichVuCongController;