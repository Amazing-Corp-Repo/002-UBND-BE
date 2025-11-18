import { hash } from "../utils/bcrypt.util.js";
import toUserResponse from "../mapper/user.mapper.js";
import UserRepository from "../repositories/user.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import MailService from "./mail.service.js";
import MAIL_TYPE from "../constants/mail.constant.js";
import { appendDeleteSuffixc, capitalizeWords } from "../utils/string.util.js";
import ROLE from "../constants/role.constant.js";

const UserService = {
    async getUserById(userId) {
        if (userId === null || userId === undefined) {
            throw new BaseError(400, 'ID người dùng không được để trống');
        }
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BaseError(404, 'Không tìm thấy người dùng');
        }
        return toUserResponse(user);
    },

    async updateUserProfile(userId, fullName, phone) {
        fullName = capitalizeWords(fullName);
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw new BaseError(404, 'Không tìm thấy người dùng');
        }

        let userUpdated = await UserRepository.updateUser(
            userId,
            { ho_va_ten: fullName, so_dien_thoai: phone, nguoi_cap_nhat: userId, thoi_gian_cap_nhat: new Date().toISOString() }
        );

        return toUserResponse(userUpdated);
    },

    async getAllUsers(page, size, isActive, role, search) {
        const { users, total } = await UserRepository.getAllUsers(page, size, isActive, role, search);
        const userResponses = users.map(user => toUserResponse(user));
        const pagination = createPagination(page, size, total);
        return { data: userResponses, pagination };
    },

    async createAccount(tenDangNhap, email, matKhau, vaiTro, currentUser) {
        if (vaiTro === ROLE.ADMIN) {
            throw new BaseError(400, 'Không thể tạo tài khoản với vai trò quản trị viên');
        }
        const existingUser = await UserRepository.findByUsernameOrEmail(tenDangNhap, email);
        if (existingUser) {
            throw new BaseError(400, 'Tài khoản hoặc email đã tồn tại');
        }

        const hashedPassword = await hash(matKhau);

        const newUser = await UserRepository.createUser({
            ten_dang_nhap: tenDangNhap,
            email,
            vai_tro: vaiTro,
            mat_khau: hashedPassword,
            nguoi_tao: currentUser,
        });

        await MailService.sendMail(
            email,
            MAIL_TYPE.ACCOUNT_CREATED,
            {
                username: tenDangNhap,
                password: matKhau,
            }
        );

        return {
            message: `Tài khoản đã được tạo và gửi mật khẩu tới ${email}`,
            user: toUserResponse(newUser),
        };
    },

    async updateProfileByAdmin(userId, hoVaTen, soDienThoai, vaiTro, tenDangNhap, email, matKhau, currentUser) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BaseError(404, 'Không tìm thấy người dùng');
        }
        if (user.vai_tro === ROLE.ADMIN && vaiTro !== ROLE.ADMIN) {
            throw new BaseError(400, 'Không thể thay đổi vai trò của quản trị viên');
        }
        if (user.vai_tro !== ROLE.ADMIN && vaiTro === ROLE.ADMIN) {
            throw new BaseError(400, 'Không thể gán vai trò quản trị viên cho người dùng');
        }
        let data = {
            ten_dang_nhap: tenDangNhap,
            email: email,
            ho_va_ten: hoVaTen,
            so_dien_thoai: soDienThoai,
            vai_tro: vaiTro,
            nguoi_cap_nhat: currentUser,
            thoi_gian_cap_nhat: new Date().toISOString()
        };
        if (matKhau) {
            data.mat_khau = await hash(matKhau);
        }
        let userUpdated = await UserRepository.updateUser(
            userId,
            data
        );
        await MailService.sendMail(
            email,
            MAIL_TYPE.UPDATE_PROFILE,
            {
                username: tenDangNhap,
                email,
                hoVaTen,
                soDienThoai,
                vaiTro,
                password: matKhau || null
            }
        );
        return toUserResponse(userUpdated);
    },

    async deleteUser(userId, currentUser) {
        if (userId === null || userId === undefined) {
            throw new BaseError(400, 'ID người dùng không được để trống');
        }
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BaseError(404, 'Không tìm thấy người dùng');
        }
        if (user.is_active) {
            throw new BaseError(400, 'Không thể xóa người dùng đang hoạt động. Vui lòng vô hiệu hóa người dùng trước khi xóa.');
        }
        await UserRepository.updateUser(
            userId,
            {
                is_delete: true,
                ten_dang_nhap: appendDeleteSuffixc(user.ten_dang_nhap),
                email: appendDeleteSuffixc(user.email),
                nguoi_cap_nhat: currentUser,
                thoi_gian_cap_nhat: new Date().toISOString()
            }
        );
    },

    async updateStatusByAdmin(userId, isActive, currentUser) {
        if (userId === null || userId === undefined) {
            throw new BaseError(400, 'ID người dùng không được để trống');
        }
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BaseError(404, 'Không tìm thấy người dùng');
        }
        if (user.vai_tro === ROLE.ADMIN) {
            throw new BaseError(400, 'Không thể thay đổi trạng thái của quản trị viên');
        }
        let userUpdated = await UserRepository.updateStatusByAdmin(
            userId,
            isActive,
            currentUser,
        );
        return toUserResponse(userUpdated);
    },

    async updateFcmToken(userId, fcmToken) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BaseError(404, 'Không tìm thấy người dùng');
        }
        let userUpdated = await UserRepository.updateUser(
            userId,
            { fcm_token: fcmToken, nguoi_cap_nhat: userId, thoi_gian_cap_nhat: new Date().toISOString() }
        );
        return toUserResponse(userUpdated);
    }
}

export default UserService;