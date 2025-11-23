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
      ],
      description:
        "API trả về danh sách tất cả các quyền hiện có trong hệ thống.",
      responses: {},
    },
  },
};

export default PermissionSwagger;
