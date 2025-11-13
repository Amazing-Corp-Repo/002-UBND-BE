import UserService from "../services/user.service.js";
import { BaseError } from "../utils/base-error.util.js";
import { successResponse } from "../utils/response.util.js";

const UserController = {
    async getMyProfile(req, res) {
        const userId = req.payload.userId;
        const result = await UserService.getUserById(userId);
        return successResponse(res, result, 'Lấy thông tin cá nhân thành công');
    },

    async updateProfile(req, res) {
        const userId = req.payload.userId;
        const { hoVaTen, soDienThoai } = req.body;
        const result = await UserService.updateUserProfile(userId, hoVaTen, soDienThoai);
        return successResponse(res, result, 'Cập nhật thông tin cá nhân thành công');
    },

    async getAllUsers(req, res) {
        const { page, size, isActive, vaiTro, search } = req.query;
        if (!page || !size) throw new BaseError(400, "page và size là bắt buộc");
        const result = await UserService.getAllUsers(parseInt(page), parseInt(size), isActive, vaiTro, search);
        return successResponse(res, result.data, "Lấy tất cả người dùng thành công", result.pagintation);
    },

    async createAccount(req, res) {
        const { tenDangNhap, email, matKhau, vaiTro } = req.body;
        const currentUser = req.payload.userId;
        const result = await UserService.createAccount(tenDangNhap, email, matKhau, vaiTro, currentUser);
        return successResponse(res, result.user, result.message);
    },

    async updateProfileByAdmin(req, res) {
        const { userId, hoVaTen, soDienThoai, vaiTro, tenDangNhap, email, matKhau } = req.body;
        const currentUser = req.payload.userId;
        const result = await UserService.updateProfileByAdmin(userId, hoVaTen, soDienThoai, vaiTro, tenDangNhap, email, matKhau, currentUser);
        return successResponse(res, result, 'Cập nhật thông tin người dùng thành công');
    },

    async deleteUser(req, res) {
        const { userId } = req.params;
        const currentUser = req.payload.userId;
        const result = await UserService.deleteUser(userId, currentUser);
        return successResponse(res, result, 'Xóa người dùng thành công');
    },

    async updateStatusByAdmin(req, res) {
        const { userId } = req.params;
        const { isActive } = req.body;
        const currentUser = req.payload.userId;
        const result = await UserService.updateStatusByAdmin(userId, isActive, currentUser);
        return successResponse(res, result, 'Cập nhật trạng thái người dùng thành công');
    },

    async updateFcmToken(req, res) {
        const userId = req.payload.userId;
        const { fcmToken } = req.body;
        const result = await UserService.updateFcmToken(userId, fcmToken);
        return successResponse(res, result, 'Cập nhật FCM token thành công');
    },

    async getUserById(req, res) {
        const { id } = req.params;
        const result = await UserService.getUserById(id);
        return successResponse(res, result, 'Lấy thông tin người dùng thành công');
    }
}
export default UserController;