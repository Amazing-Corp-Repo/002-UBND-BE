import { compare, hash } from "../utils/bcrypt.util.js";
import toUserResponse from "../mapper/user.mapper.js";
import UserRepository from "../repositories/user.repository.js";
import { BaseError } from "../utils/base-error.util.js";
import { createPagination } from "../utils/response.util.js";
import MailService from "./mail.service.js";
import MAIL_TYPE from "../constants/mail.constant.js";
import { appendDeleteSuffixc, capitalizeWords } from "../utils/string.util.js";
import RoleRepository from "../repositories/role.repository.js";
import CaptchaRepository from "../repositories/http/captcha.repository.js";

const UserService = {
  async getUserById(userId) {
    if (userId === null || userId === undefined) {
      throw new BaseError(400, "ID người dùng không được để trống");
    }
    const user = await UserRepository.findById(userId);
    let vai_tro = "";
    if (user.user_roles && user.user_roles.length > 0) {
      vai_tro = user.user_roles.map((ur) => ur.roles.name).join(" ");
    }
    user.vai_tro = vai_tro;
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    return toUserResponse(user);
  },

  async updateUserProfile(userId, fullName, phone) {
    fullName = capitalizeWords(fullName);
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }

    let userUpdated = await UserRepository.updateUser(userId, {
      ho_va_ten: fullName,
      so_dien_thoai: phone,
      nguoi_cap_nhat: userId,
      thoi_gian_cap_nhat: new Date().toISOString(),
    });

    return toUserResponse(userUpdated);
  },

  async getAllUsers(page, size, isActive, role, search) {
    const { users, total } = await UserRepository.getAllUsers(
      page,
      size,
      isActive,
      role,
      search
    );
    const userResponses = users.map((user) => {
      let vai_tro = "";
      if (user.user_roles && user.user_roles.length > 0) {
        vai_tro = user.user_roles.map((ur) => ur.roles.name).join(" ");
      }
      user.vai_tro = vai_tro;
      return toUserResponse(user);
    });
    const pagination = createPagination(page, size, total);
    return { data: userResponses, pagination };
  },

  async createAccount(tenDangNhap, email, matKhau, vaiTro, currentUser) {
    let existingRole = await RoleRepository.getById(vaiTro);
    if (!existingRole) {
      throw new BaseError(400, "Vai trò không hợp lệ");
    }
    // if (existingRole.name === "ADMIN") {
    //   throw new BaseError(400, "Không thể tạo tài khoản với vai trò ADMIN");
    // }
    const existingUsers = await UserRepository.findByUsernameOrEmailList(
      tenDangNhap,
      email
    );

    if (existingUsers.length > 0) {
      throw new BaseError(400, "Tài khoản hoặc email đã tồn tại");
    }

    const hashedPassword = await hash(matKhau);

    const newUser = await UserRepository.createUser({
      ten_dang_nhap: tenDangNhap,
      email,
      vai_tro: vaiTro,
      mat_khau: hashedPassword,
      nguoi_tao: currentUser,
    });

    await MailService.sendMail(email, MAIL_TYPE.ACCOUNT_CREATED, {
      username: tenDangNhap,
      password: matKhau,
    });

    return {
      message: `Tài khoản đã được tạo và gửi mật khẩu tới ${email}`,
      user: toUserResponse(newUser),
    };
  },

  async updateProfileByAdmin(
    userId,
    hoVaTen,
    soDienThoai,
    vaiTro,
    tenDangNhap,
    email,
    matKhau,
    currentUser
  ) {
    const existingRole = await RoleRepository.getById(vaiTro);
    if (!existingRole) {
      throw new BaseError(400, "Vai trò không hợp lệ");
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    // if (existingRole.name === "ADMIN") {
    //   throw new BaseError(400, "Không thể gán vai trò ADMIN cho người dùng");
    // }
    // if (user.user_roles.includes((ur) => ur.roles.name === "ADMIN")) {
    //   throw new BaseError(400, "Không thể chỉnh sửa người dùng với vai trò ADMIN");
    // }
    const existingUsers = await UserRepository.findByUsernameOrEmailList(
      tenDangNhap,
      email
    );

    const conflicted = existingUsers.find((u) => u.id !== userId);

    if (conflicted) {
      throw new BaseError(400, "Tài khoản hoặc email đã tồn tại");
    }

    const data = {
      ten_dang_nhap: tenDangNhap,
      email: email,
      ho_va_ten: hoVaTen,
      so_dien_thoai: soDienThoai,
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date(),
    };

    if (matKhau) {
      data.mat_khau = await hash(matKhau);
    }

    const updatedUser = await UserRepository.updateUserByAdmin(
      userId,
      data,
      vaiTro
    );
    updatedUser.vai_tro = existingRole.name;

    await MailService.sendMail(email, MAIL_TYPE.UPDATE_PROFILE, {
      username: tenDangNhap,
      email,
      hoVaTen,
      soDienThoai,
      vaiTro: existingRole.name,
      password: matKhau || null,
    });

    return toUserResponse(updatedUser);
  },

  async deleteUser(userId, currentUser) {
    if (userId === null || userId === undefined) {
      throw new BaseError(400, "ID người dùng không được để trống");
    }
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    if (user.is_active) {
      throw new BaseError(
        400,
        "Không thể xóa người dùng đang hoạt động. Vui lòng vô hiệu hóa người dùng trước khi xóa."
      );
    }
    await UserRepository.updateUser(userId, {
      is_delete: true,
      ten_dang_nhap: appendDeleteSuffixc(user.ten_dang_nhap),
      email: appendDeleteSuffixc(user.email),
      nguoi_cap_nhat: currentUser,
      thoi_gian_cap_nhat: new Date().toISOString(),
    });
  },

  async updateStatusByAdmin(userId, isActive, currentUser) {
    if (userId === null || userId === undefined) {
      throw new BaseError(400, "ID người dùng không được để trống");
    }
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }
    let vai_tro = user.user_roles
      ? user.user_roles.map((ur) => ur.roles.name).join(" ")
      : "";
    if (vai_tro === "ADMIN") {
      throw new BaseError(
        400,
        "Không thể thay đổi trạng thái của quản trị viên"
      );
    }
    let userUpdated = await UserRepository.updateStatusByAdmin(
      userId,
      isActive,
      currentUser
    );
    return toUserResponse(userUpdated);
  },

  async updateFcmToken(userId, fcmToken) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }

    if (!fcmToken) {
      throw new BaseError(400, "FCM token không hợp lệ");
    }

    const currentTokens = user.fcm_token || [];

    const updatedTokens = currentTokens.includes(fcmToken)
      ? currentTokens
      : [...currentTokens, fcmToken];

    const userUpdated = await UserRepository.updateUser(userId, {
      fcm_token: updatedTokens,
      nguoi_cap_nhat: userId,
      thoi_gian_cap_nhat: new Date().toISOString(),
    });

    return toUserResponse(userUpdated);
  },

  async createAdminAccount(tenDangNhap, email, matKhau) {
    const existingUsers = await UserRepository.findByUsernameOrEmailList(
      tenDangNhap,
      email
    );

    const conflicted = existingUsers.find((u) => u.id !== userId);

    if (conflicted) {
      throw new BaseError(400, "Tài khoản hoặc email đã tồn tại");
    }
    let roleAdmin = await RoleRepository.findRoleByName("ADMIN");
    if (!roleAdmin) {
      throw new BaseError(500, "Vai trò ADMIN không tồn tại trong hệ thống");
    }
    const hashedPassword = await hash(matKhau);
    const newUser = await UserRepository.createUser({
      ten_dang_nhap: tenDangNhap,
      email,
      vai_tro: roleAdmin.id,
      mat_khau: hashedPassword,
    });
    return toUserResponse(newUser);
  },

  async searchUsers(search) {
    const users = await UserRepository.searchUsers(search);
    return users;
  },

  async updateFirstLogin(
    tenDangNhap,
    tmpPassword,
    newPassword,
    email,
    recaptchaToken,
    ip
  ) {
    let user = await UserRepository.findByUsername(tenDangNhap.toLowerCase());

    if (!user) {
      throw new BaseError(404, "Không tìm thấy người dùng");
    }

    const data = await CaptchaRepository.verify(recaptchaToken, ip);

    if (!data.success) {
      throw new BaseError(400, "Xác thực reCAPTCHA không thành công");
    }

    if ((await compare(tmpPassword, user.mat_khau)) === false) {
      throw new BaseError(400, "Mật khẩu hiện tại không đúng");
    }

    if (email) {
      let existingUserEmail = await UserRepository.findByEmail(email);

      if (existingUserEmail) {
        throw new BaseError(400, "Email đã được sử dụng bởi người dùng khác");
      }
    }

    const hashedPassword = await hash(newPassword);

    let dataUpdate = {
      mat_khau: hashedPassword,
      is_active: true,
      nguoi_cap_nhat: user.id,
      thoi_gian_cap_nhat: new Date().toISOString(),
    }

    if (email) {
      dataUpdate.email = email;
    }

    user = await UserRepository.updateUser(user.id, dataUpdate);
  },
};

export default UserService;
