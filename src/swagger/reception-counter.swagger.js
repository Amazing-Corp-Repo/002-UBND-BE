const counterSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    counterCode: { type: "string", example: "QUAY_1" },
    counterName: { type: "string", example: "Quầy số 1" },
    order: { type: "integer", example: 1 },
    description: { type: "string", nullable: true },
    defaultCapacity: { type: "integer", minimum: 1, example: 2 },
    location: { type: "string", nullable: true, example: "Tầng 1, khu A" },
    isActive: { type: "boolean", example: true },
    createdAt: { type: "string", format: "date-time", nullable: true },
    updatedAt: { type: "string", format: "date-time", nullable: true },
  },
};

const ReceptionCounterSwagger = {
  "/api/reception-counters": {
    get: {
      tags: ["ReceptionCounter"],
      summary: "Lấy danh sách quầy tiếp dân",
      description:
        "Trả về các quầy đang hoạt động theo thứ tự từ quầy 1 đến quầy 8. API dùng danh mục quầy trong database, yêu cầu access token và quyền LTD_GET_ALL.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Lấy danh sách quầy tiếp dân thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { type: "array", items: counterSchema },
                  message: {
                    type: "string",
                    example: "Lấy danh sách quầy tiếp dân thành công",
                  },
                },
              },
              example: {
                success: true,
                data: [
                  {
                    id: "123e4567-e89b-42d3-a456-426614174001",
                    counterCode: "QUAY_1",
                    counterName: "Quầy số 1",
                    order: 1,
                    description: null,
                    defaultCapacity: 2,
                    location: "Tầng 1, khu A",
                    isActive: true,
                    createdAt: "2026-08-20T00:00:00.000Z",
                    updatedAt: null,
                  },
                ],
                message: "Lấy danh sách quầy tiếp dân thành công",
              },
            },
          },
        },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LTD_GET_ALL" },
      },
    },
  },
  "/api/reception-counters/{id}": {
    get: {
      tags: ["ReceptionCounter"],
      summary: "Lấy chi tiết quầy tiếp dân",
      description:
        "Trả về thông tin một quầy đang hoạt động theo UUID. Yêu cầu access token và quyền LTD_GET_ALL.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
            example: "223e4567-e89b-42d3-a456-426614174001",
          },
        },
      ],
      responses: {
        200: {
          description: "Lấy chi tiết quầy tiếp dân thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: counterSchema,
                  message: { type: "string" },
                },
              },
              example: {
                success: true,
                data: {
                  id: "223e4567-e89b-42d3-a456-426614174001",
                  counterCode: "QUAY_1",
                  counterName: "Quầy số 1",
                  order: 1,
                  description: null,
                  defaultCapacity: 2,
                  location: "Tầng 1, khu A",
                  isActive: true,
                  createdAt: "2026-08-20T00:00:00.000Z",
                  updatedAt: null,
                },
                message: "Lấy chi tiết quầy tiếp dân thành công",
              },
            },
          },
        },
        400: { description: "ID quầy không đúng định dạng UUID" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LTD_GET_ALL" },
        404: { description: "Quầy tiếp dân không tồn tại" },
      },
    },
  },
};

export default ReceptionCounterSwagger;
