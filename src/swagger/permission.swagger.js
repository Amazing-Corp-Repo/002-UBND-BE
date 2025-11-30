const PermissionSwagger = {
  "/api/permission": {
    get: {
      tags: ["Permission"],
      security: [{ bearerAuth: [] }],
      summary: "Lấy tất cả quyền",
      parameters: [
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Từ khóa tìm kiếm mô tả quyền",
        },
        {
          name: "danhMuc",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Lọc theo danh mục quyền",
        },
      ],
      description:
        "API trả về danh sách tất cả các quyền hiện có trong hệ thống.",
      responses: {},
    },
  },
  "/api/permission/cate": {
    get: {
      tags: ["Permission"],
      security: [{ bearerAuth: [] }],
      summary: "Lấy danh mục quyền",
      description: "API trả về danh sách các danh mục quyền.",
      responses: {},
    },
  }
};

export default PermissionSwagger;
