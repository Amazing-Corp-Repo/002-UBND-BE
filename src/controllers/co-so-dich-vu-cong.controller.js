import CoSoDichVuCongService from "../services/co-so-dich-cong.service.js";
import { successResponse } from "../utils/response.util.js";

const CoSoDichVuCongController = {
    async getAll(req, res) {
        const { isActive, search } = req.query;
        const searchTerm =
            typeof search === "string" && search.trim() !== ""
                ? search.trim()
                : undefined;

        const result = await CoSoDichVuCongService.getAll(
            isActive,
            searchTerm
        );
        return successResponse(res, result, "Lấy danh sách cơ sở dịch vụ công");
    },

    async create(req, res) {
        const {
            tenCoSo,
            diaChi,
            soDienThoai,
            moTa,
            linkGoogleMap
        } = req.body;
        const currentUser = req.payload.userId
        const result = await CoSoDichVuCongService.create(
            tenCoSo,
            diaChi,
            soDienThoai,
            moTa,
            linkGoogleMap,
            currentUser
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
            tenCoSo,
            diaChi,
            soDienThoai,
            moTa,
            linkGoogleMap,
        } = req.body;
        const currentUser = req.payload.userId
        const result = await CoSoDichVuCongService.update(
            id,
            tenCoSo,
            diaChi,
            soDienThoai,
            moTa,
            linkGoogleMap,
            currentUser
        );
        return successResponse(res, result, "Cập nhật cơ sở dịch vụ công thành công");
    },

    async updateStatus(req, res) {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.payload.userId
        const result = await CoSoDichVuCongService.updateStatus(
            id,
            isActive,
            currentUser
        );
        return successResponse(res, result, "Cập nhật trạng thái cơ sở dịch vụ công thành công");
    },

    async delete(req, res) {
        const { id } = req.params;
        const currentUser = req.payload.userId
        await CoSoDichVuCongService.delete(id, currentUser);
        return successResponse(res, null, "Xóa cơ sở dịch vụ công thành công");
    }
};


export default CoSoDichVuCongController;