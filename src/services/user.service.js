import { hash } from "../utils/bcrypt.util.js";
import toUserResponse from "../mapper/user.mapper.js";
import UserRepository from "../repositories/user.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import MailService from "./mail.service.js";
import MAIL_TYPE from "../constants/mail.constant.js";

const UserService = {
    async getUserById(userId) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BaseError(404, 'Không tìm thấy người dùng');
        }
        return toUserResponse(user);
    },

    async updateUserProfile(userId, fullName, phone) {
        const user = await UserRepository.findById(userId);

        if (!user) {
            throw new BaseError(404, 'Không tìm thấy người dùng');
        }

        let userUpdated = await UserRepository.updateUser(
            userId,
            { ho_va_ten: fullName, so_dien_thoai: phone }
        );

        return toUserResponse(userUpdated);
    },

    async getAllUsers(page, size) {
        const { users, total } = await UserRepository.getAllUsers(page, size);
        const userResponses = users.map(user => toUserResponse(user));
        const pagintation = createPagination(page, size, total);
        return { data: userResponses, pagintation };
    },

    async createAccount(tenDangNhap, email, matKhau, vaiTro, currentUser) {
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

    async updateProfileByAdmin(userId, hoVaTen, soDienThoai, vaiTro, trangThai) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw new BaseError(404, 'Không tìm thấy người dùng');
        }
        let userUpdated = await UserRepository.updateUser(
            userId,
            { ho_va_ten: hoVaTen, so_dien_thoai: soDienThoai, vai_tro: vaiTro, trang_thai: trangThai }
        );
        return toUserResponse(userUpdated);
    }
}

export default UserService;