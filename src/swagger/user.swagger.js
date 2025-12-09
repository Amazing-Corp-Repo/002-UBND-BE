import UserSchemas from "../schemas/user.schema.js";

const UserSwagger = {
  "/api/users/my-profile": {
    get: {
      tags: ["Users"],
      summary: "Lấy hồ sơ của tôi",
      description: "Lấy thông tin hồ sơ của người dùng đang đăng nhập",
      security: [{ bearerAuth: [] }],
      responses: {},
    },
  },
  "/api/users": {
    get: {
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      summary: "Lấy danh sách người dùng có phân trang",
      description:
        "Trả về danh sách người dùng theo phân trang. Yêu cầu tham số truy vấn page và size.",
      parameters: [
        {
          name: "page",
          in: "query",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Số trang để phân trang",
        },
        {
          name: "size",
          in: "query",
          required: true,
          schema: { type: "integer", minimum: 1 },
          description: "Số người dùng trên mỗi trang",
        },
        {
          name: "isActive",
          in: "query",
          required: false,
          schema: { type: "boolean" },
          description: "Lọc người dùng theo trạng thái hoạt động",
        },
        {
          name: "vaiTro",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Lọc người dùng theo vai trò",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description:
            "Từ khóa tìm kiếm trong tên đăng nhập, họ và tên hoặc email",
        },
      ],
      responses: {},
    },

    put: {
      tags: ["Users"],
      summary: "Cập nhật hồ sơ người dùng",
      description: "Cập nhật thông tin hồ sơ của người dùng đang đăng nhập",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: UserSchemas.UpdateProfileRequest,
          },
        },
      },
      responses: {},
    },
  },
  "/api/users/create-account": {
    post: {
      tags: ["Users"],
      summary: "Tạo tài khoản người dùng mới (do admin thực hiện)",
      description:
        "Tạo tài khoản người dùng mới với tên đăng nhập và email cung cấp. Chỉ admin có quyền thực hiện.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: UserSchemas.CreateAccountRequest,
          },
        },
      },
      responses: {},
    },
  },
  "/api/users/update-by-admin": {
    put: {
      tags: ["Users"],
      summary: "Cập nhật hồ sơ người dùng bởi admin",
      description: "Admin cập nhật thông tin hồ sơ cho một người dùng",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: UserSchemas.UpdateProfileByAdminRequest,
          },
        },
      },
      responses: {},
    },
  },
  "/api/users/{userId}": {
    delete: {
      tags: ["Users"],
      summary: "Xóa người dùng bởi admin",
      description: "Xóa người dùng theo ID. Chỉ admin mới có quyền thực hiện.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "userId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của người dùng cần xóa",
        },
      ],
      responses: {},
    },
  },
  "/api/users/update-status/{userId}": {
    put: {
      tags: ["Users"],
      summary: "Cập nhật trạng thái hoạt động của người dùng bởi admin",
      description:
        "Admin cập nhật trạng thái hoạt động (kích hoạt/hủy kích hoạt) cho một người dùng",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "userId",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của người dùng cần cập nhật trạng thái",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: UserSchemas.UpdateStatusByAdminRequest,
          },
        },
      },
      responses: {},
    },
  },
  "/api/users/fcm-token": {
    put: {
      tags: ["Users"],
      summary: "Cập nhật FCM token cho người dùng",
      description: "Cập nhật FCM token để nhận thông báo đẩy",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: UserSchemas.UpdateFcmTokenRequest,
          },
        },
      },
      responses: {},
    },
  },
  "/api/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Lấy thông tin người dùng theo ID",
      description:
        "Lấy thông tin chi tiết của một người dùng dựa trên ID của họ. Chỉ admin mới có quyền thực hiện.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID của người dùng cần lấy thông tin",
        },
      ],
      responses: {},
    },
  },
  "/api/users/search": {
    get: {
      tags: ["Users"],
      summary: "Tìm kiếm người dùng",
      description:
        "Tìm kiếm người dùng dựa trên từ khóa trong tên đăng nhập, họ và tên hoặc email",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Từ khóa tìm kiếm",
        },
      ],
      responses: {},
    },
  },
};

export default UserSwagger;
