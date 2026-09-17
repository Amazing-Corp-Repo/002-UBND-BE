const ExportSwagger = {
  "/api/export/phan-anh": {
    post: {
      tags: ["Export"],
      summary: "Tạo yêu cầu xuất ZIP phản ánh",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date-time",
          },
          description: "Ngày bắt đầu (YYYY-MM-DD)",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date-time",
          },
          description: "Ngày kết thúc (YYYY-MM-DD)",
        },
        {
          name: "username",
          in: "query",
          required: true,
        },
        {
          name: "password",
          in: "query",
          required: true,
        },
        {
          name: "email",
          in: "query",
          required: true,
        },
      ],
      responses: {},
    },
    get: {
      tags: ["Export"],
      summary: "Lấy danh sách file ZIP phản ánh đã xuất",
      security: [{ bearerAuth: [] }],
      responses: {},
    },
  },
  "/api/export/phan-anh/{fileName}/download": {
    get: {
      tags: ["Export"],
      summary: "Tải file ZIP phản ánh đã xuất",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "fileName",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "Tên file export phản ánh",
        },
      ],
      responses: {},
    },
  },
  "/api/export/phan-anh/{fileName}/delete": {
    delete: {
      tags: ["Export"],
      summary: "Xóa file ZIP phản ánh đã xuất",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "fileName",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "Tên file export phản ánh",
        },
        {
          name: "username",
          in: "query",
          required: true,
        },
        {
          name: "password",
          in: "query",
          required: true,
        },
      ],
      responses: {},
    },
  },
};

export default ExportSwagger;
