import LinhVucSchemas from "../schemas/linh-vuc.schema.js";

const LinhVucSwagger = {
  "/api/linh-vuc": {
    get: {
      tags: ["LinhVuc"],
      summary: "Lấy danh sách lĩnh vực",
      parameters: [
        {
          name: "isActive",
          in: "query",
          description: "Bộ lọc lĩnh vực đã bị xóa hay chưa (true/false)",
          required: false,
          schema: {
            type: "boolean",
          },
        },
        {
          name: "search",
          in: "query",
          description: "Từ khóa tìm kiếm trong tên lĩnh vực",
          required: false,
          schema: { type: "string" },
        },
      ],
      responses: {},
    },
    post: {
      tags: ["LinhVuc"],
      summary: "Tạo lĩnh vực mới",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: LinhVucSchemas.CreateLinhVucRequest,
          },
        },
      },
      responses: {},
    },
  },

  "/api/linh-vuc/{id}": {
    put: {
      tags: ["LinhVuc"],
      summary: "Cập nhật lĩnh vực",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "ID của lĩnh vực cần cập nhật",
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
            schema: LinhVucSchemas.UpdateLinhVucRequest,
          },
        },
      },
      responses: {},
    },
    delete: {
      tags: ["LinhVuc"],
      summary: "Xóa lĩnh vực",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {},
    },
    get: {
      tags: ["LinhVuc"],
      summary: "Lấy thông tin lĩnh vực theo ID",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {},
    },
  },

  "/api/linh-vuc/update-status/{id}": {
    put: {
      tags: ["LinhVuc"],
      summary: "Cập nhật trạng thái hoạt động của lĩnh vực",
      security: [{ bearerAuth: [] }],
      parameters: [
        { 
          name: "id", 
          in: "path", 
          required: true,
          schema: { type: "string", format: "uuid" } 
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: LinhVucSchemas.UpdateLinhVucStatusRequest,
          },
        },
      },
      responses: {},
    },
  },
};

export default LinhVucSwagger;
