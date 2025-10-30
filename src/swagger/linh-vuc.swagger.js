import LinhVucSchemas from "../schemas/linh-vuc.schema.js";

const LinhVucSwagger = {
  "/api/linh-vuc": {
    get: {
      tags: ["LinhVuc"],
      summary: "Lấy danh sách lĩnh vực",
      parameters: [
        {
          name: "is_removed",
          in: "query",
          description: "Bộ lọc lĩnh vực đã bị xóa hay chưa (true/false)",
          required: false,
          schema: {
            type: "boolean",
          },
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
            example: {
              ten_linh_vuc: "Thủ tục hành chính",
              mo_ta: "Mô tả về lĩnh vực thủ tục hành chính",
            },
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
            example: {
              ten_linh_vuc: "Thủ tục hành chính (đã cập nhật)",
              mo_ta: "Mô tả đã được cập nhật về lĩnh vực thủ tục hành chính",
              is_remove: false,
            },
          },
        },
      },
      responses: {},
    },
    delete: {
      tags: ["LinhVuc"],
      summary: "Xóa cứng lĩnh vực",
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
  },
};

export default LinhVucSwagger;
