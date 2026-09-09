const LogSwagger = {
  "/api/logs": {
    get: {
      tags: ["Logs"],
      summary: "Lấy danh sách file log",
      description:
        "Xác thực bằng username và password trong query string theo cơ chế logAuthMiddleware.",
      parameters: [
        {
          name: "username",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "password",
          in: "query",
          required: true,
          schema: { type: "string", format: "password" },
        },
      ],
      responses: {
        200: {
          description: "Lấy danh sách file log thành công",
          content: {
            "application/json": {
              example: {
                success: true,
                data: [
                  {
                    name: "app.log",
                    size: "0.12 MB",
                    modified: "2026-09-09T08:00:00.000Z",
                  },
                ],
                message: "Lấy danh sách log thành công",
              },
            },
          },
        },
        400: { description: "Thiếu username hoặc password" },
        401: { description: "Sai username hoặc password" },
        500: { description: "Không thể đọc thư mục log" },
      },
    },
  },
  "/api/logs/view/{fileName}": {
    get: {
      tags: ["Logs"],
      summary: "Xem nội dung file log",
      parameters: [
        {
          name: "fileName",
          in: "path",
          required: true,
          schema: { type: "string", pattern: "^[^/]+\\.log(?:\\.\\d+)?$" },
        },
        {
          name: "username",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "password",
          in: "query",
          required: true,
          schema: { type: "string", format: "password" },
        },
      ],
      responses: {
        200: {
          description: "Nội dung file log",
          content: { "text/plain": { schema: { type: "string" } } },
        },
        400: { description: "Thiếu username hoặc password" },
        401: { description: "Sai username hoặc password" },
        404: { description: "File log không tồn tại" },
        500: { description: "Lỗi khi đọc file log" },
      },
    },
  },
  "/api/logs/download/{fileName}": {
    get: {
      tags: ["Logs"],
      summary: "Tải file log",
      parameters: [
        {
          name: "fileName",
          in: "path",
          required: true,
          schema: { type: "string", pattern: "^[^/]+\\.log(?:\\.\\d+)?$" },
        },
        {
          name: "username",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
        {
          name: "password",
          in: "query",
          required: true,
          schema: { type: "string", format: "password" },
        },
      ],
      responses: {
        200: {
          description: "File log tải xuống thành công",
          content: { "text/plain": { schema: { type: "string", format: "binary" } } },
        },
        400: { description: "Thiếu username hoặc password" },
        401: { description: "Sai username hoặc password" },
        404: { description: "File log không tồn tại" },
        500: { description: "Lỗi khi tải file log" },
      },
    },
  },
};

export default LogSwagger;
