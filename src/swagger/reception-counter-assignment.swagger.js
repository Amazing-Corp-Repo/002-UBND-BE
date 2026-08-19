const ReceptionCounterAssignmentSwagger = {
  "/api/reception-counter-assignments": {
    get: {
      tags: ["ReceptionCounterAssignment"],
      summary: "Lấy danh sách phân công cán bộ - quầy",
      description:
        "Trả về phân công theo đúng ca và cấu hình quầy; có thể lọc theo ca, quầy, cán bộ và trạng thái. Yêu cầu quyền LTD_GET_ALL.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "shiftId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "counterId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "officerId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "isActive", in: "query", schema: { type: "boolean" } },
      ],
      responses: {
        200: {
          description: "Lấy danh sách phân công quầy thành công",
          content: {
            "application/json": {
              example: {
                success: true,
                data: [{
                  id: "423e4567-e89b-42d3-a456-426614174001",
                  shiftId: "323e4567-e89b-42d3-a456-426614174001",
                  counterConfigurationId: "223e4567-e89b-42d3-a456-426614174001",
                  counter: { id: "123e4567-e89b-42d3-a456-426614174001", counterCode: "QUAY_1", counterName: "Quầy số 1" },
                  officer: { id: "523e4567-e89b-42d3-a456-426614174001", fullName: "Nguyễn Văn An", username: "canbo" },
                  receptionDate: "2026-08-26",
                  startTime: "07:30:00",
                  endTime: "08:30:00",
                  isActive: true,
                }],
                message: "Lấy danh sách phân công quầy thành công",
              },
            },
          },
        },
        400: { description: "Bộ lọc UUID hoặc trạng thái không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LTD_GET_ALL" },
      },
    },
  },
  "/api/reception-counter-assignments/{id}": {
    get: {
      tags: ["ReceptionCounterAssignment"],
      summary: "Lấy chi tiết phân công cán bộ - quầy",
      description:
        "Trả về thông tin một phân công, gồm ca tiếp dân, quầy và cán bộ được phân công. Yêu cầu quyền LTD_GET_ALL.",
      security: [{ bearerAuth: [] }],
      parameters: [{
        name: "id",
        in: "path",
        required: true,
        description: "ID phân công quầy tiếp dân",
        schema: {
          type: "string",
          format: "uuid",
          example: "423e4567-e89b-42d3-a456-426614174001",
        },
      }],
      responses: {
        200: {
          description: "Lấy chi tiết phân công quầy thành công",
          content: {
            "application/json": {
              example: {
                success: true,
                data: {
                  id: "423e4567-e89b-42d3-a456-426614174001",
                  shiftId: "323e4567-e89b-42d3-a456-426614174001",
                  counterConfigurationId: "223e4567-e89b-42d3-a456-426614174001",
                  counter: {
                    id: "123e4567-e89b-42d3-a456-426614174001",
                    counterCode: "QUAY_1",
                    counterName: "Quầy số 1",
                  },
                  officer: {
                    id: "523e4567-e89b-42d3-a456-426614174001",
                    fullName: "Nguyễn Văn An",
                    username: "canbo",
                  },
                  receptionDate: "2026-08-26",
                  startTime: "07:30:00",
                  endTime: "08:30:00",
                  isActive: true,
                },
                message: "Lấy chi tiết phân công quầy thành công",
              },
            },
          },
        },
        400: { description: "ID phân công không đúng định dạng UUID" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LTD_GET_ALL" },
        404: { description: "Phân công quầy tiếp dân không tồn tại" },
      },
    },
  },
};

export default ReceptionCounterAssignmentSwagger;
