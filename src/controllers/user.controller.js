import UserService from "../services/user.service.js";
import { successResponse } from "../utils/response.util.js";

const UserController = {
    async getMyProfile(req, res) {
        const userId = req.payload.userId;
        const result = await UserService.getUserById(userId);
        return successResponse(res, result, 'Lấy thông tin cá nhân thành công');
    },

    async updateProfile(req, res) {
        const userId = req.payload.userId;
        const { fullName, phone } = req.body;
        const result = await UserService.updateUserProfile(userId, fullName, phone);
        return successResponse(res, result, 'Cập nhật thông tin cá nhân thành công');
    },

    async getAllUsers(req, res) {
        const { page, size } = req.query;
        if (!page || !size) throw new BaseError(400, "page và size là bắt buộc");
        const result = await UserService.getAllUsers(parseInt(page), parseInt(size));
        return successResponse(res, result.data, "Lấy tất cả người dùng thành công", result.pagintation);
    },

    async createAccount(req, res) {
        const { tenDangNhap, email, matKhau, vaiTro } = req.body;
        const currentUser = req.payload.userId;
        const result = await UserService.createAccount(tenDangNhap, email, matKhau, vaiTro, currentUser);
        return successResponse(res, result.user, result.message);
    },
}
export default UserController;