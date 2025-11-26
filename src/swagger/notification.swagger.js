const NotificationSwagger = {
  "/api/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "Lấy danh sách thông báo của người dùng",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          description: "Page number for pagination (default is 1)",
          required: true,
          schema: {
            type: "integer",
            default: 1,
          },
        },
        {
          name: "size",
          in: "query",
          description:
            "Number of items per page for pagination (default is 10)",
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

  "/api/notifications/mark-all-read": {
    post: {
      tags: ["Notifications"],
      summary: "Đánh dấu tất cả thông báo đã đọc",
      security: [{ bearerAuth: [] }],
      responses: {},
    },
  },

  "/api/notifications/{id}": {
    delete: {
      tags: ["Notifications"],
      summary: "Xóa thông báo theo ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          description: "ID của thông báo cần xóa",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {},
    },
  },

  "/api/notifications/{id}/mark-read": {
    post: {
      tags: ["Notifications"],
      summary: "Đánh dấu thông báo đã đọc theo ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          description: "ID của thông báo cần đánh dấu đã đọc",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {},
    },
  },
};

export default NotificationSwagger;
