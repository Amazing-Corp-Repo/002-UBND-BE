import RoleSchemas from "../schemas/role.schema.js";

const RoleSwagger = {
  "/api/role": {
    get: {
      tags: ["Role"],
      summary: "Lấy tất cả role",
      parameters: [
        {
          name: "search",
          in: "query",
          description: "Từ khóa tìm kiếm trong tên vai trò",
          required: false,
          schema: {
            type: "string",
          },
        },
      ],
      description:
        "API trả về danh sách tất cả các role hiện có trong hệ thống.",
      responses: {},
    },
    post: {
      tags: ["Role"],
      security: [{ bearerAuth: [] }],
      summary: "Tạo vai trò mới",
      description:
        "API cho phép tạo một vai trò mới với tên, mô tả và danh sách quyền.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: RoleSchemas.CreateRoleRequest,
          },
        },
      },
      responses: {},
    },
  },
  '/api/role/pagination': {
    get: {
      tags: ["Role"],
      summary: "Lấy tất cả vai trò với phân trang",
      description:
        "API trả về danh sách tất cả các vai trò hiện có trong hệ thống với phân trang.",
      parameters: [
        {
          name: "isActive",
          in: "query",
          description: "Lọc theo trạng thái hoạt động",
          required: false,
          schema: {
            type: "boolean",
          },
        },
        {
          name: "search",
          in: "query",
          description: "Từ khóa tìm kiếm trong tên vai trò",
          required: false,
          schema: {
            type: "string",
          },
        },
        {
          name: "page",
          in: "query",
          description: "Số trang hiện tại",
          required: true,
          schema: {
            type: "integer",
            default: 1,
          },
        },
        {
          name: "size",
          in: "query",
          description: "Số mục trên mỗi trang",
          required: true,
          schema: {
            type: "integer",
            default: 10,
          },
        },
      ],
      responses: {},
    },
  },
  '/api/role/{roleId}': {
    get: {
      tags: ["Role"],
      summary: "Lấy chi tiết vai trò",
      description:
        "API trả về chi tiết của một vai trò dựa trên roleId.",
      parameters: [
        {
          name: "roleId",
          in: "path",
          description: "ID của vai trò cần lấy chi tiết",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],
      responses: {},
    },
    put: {
      tags: ["Role"],
      security: [{ bearerAuth: [] }],
      summary: "Cập nhật vai trò",
      description:
        "API cho phép cập nhật thông tin của một vai trò dựa trên roleId.",
      parameters: [
        {
          name: "roleId",
          in: "path",
          description: "ID của vai trò cần cập nhật",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: RoleSchemas.UpdateRoleRequest,
          },
        },
      },
      responses: {},
    },
    delete: {
      tags: ["Role"],
      security: [{ bearerAuth: [] }],
      summary: "Xóa vai trò",
      description:
        "API cho phép xóa một vai trò dựa trên roleId.",
      parameters: [
        {
          name: "roleId",
          in: "path",
          description: "ID của vai trò cần xóa",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],
      responses: {},
    },
  },
  '/api/role/update-status/{roleId}': {
    put: {
      tags: ["Role"],
      security: [{ bearerAuth: [] }],
      summary: "Cập nhật trạng thái vai trò",
      description:
        "API cho phép cập nhật trạng thái hoạt động của một vai trò dựa trên roleId.",
      parameters: [
        {
          name: "roleId",
          in: "path",
          description: "ID của vai trò cần cập nhật trạng thái",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: RoleSchemas.UpdateRoleStatusRequest,
          },
        },
      },
      responses: {},
    },
  },
};

export default RoleSwagger;
