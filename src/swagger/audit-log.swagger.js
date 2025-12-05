const AuditLogSwagger = {
  "/api/audit-logs": {
    get: {
      tags: ["AuditLogs"],
      summary: "Lấy danh sách nhật ký hệ thống",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            default: 1,
          },
          description: "Số trang",
        },
        {
          name: "size",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            default: 10,
          },
          description: "Số mục trên mỗi trang",
        },
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "Từ khóa tìm kiếm",
        },
      ],
      responses: {},
    },
  },
  "/api/audit-logs/{id}": {
    get: {
      tags: ["AuditLogs"],
      summary: "Lấy chi tiết nhật ký hệ thống",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID nhật ký hệ thống",
        },
      ],
      responses: {},
    },
  },
};

export default AuditLogSwagger;
