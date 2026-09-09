const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "options", "head"]);

const defaultResponses = (operation) => ({
  200: {
    description: `${operation.summary || "Thao tác"} thành công`,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { nullable: true },
            message: { type: "string" },
          },
        },
        example: {
          success: true,
          data: null,
          message: `${operation.summary || "Thao tác"} thành công`,
        },
      },
    },
  },
  400: { description: "Dữ liệu hoặc tham số không hợp lệ" },
  401: { description: "Thiếu hoặc sai access token" },
  403: { description: "Không có quyền thực hiện thao tác" },
  404: { description: "Không tìm thấy tài nguyên" },
  409: { description: "Dữ liệu bị xung đột hoặc đã tồn tại" },
  500: { description: "Lỗi máy chủ nội bộ" },
});

export const fillEmptyResponses = (swaggerPaths) => {
  for (const pathItem of Object.values(swaggerPaths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method) || !operation || typeof operation !== "object") continue;
      if (operation.responses && Object.keys(operation.responses).length === 0) {
        operation.responses = defaultResponses(operation);
      }
    }
  }

  return swaggerPaths;
};
