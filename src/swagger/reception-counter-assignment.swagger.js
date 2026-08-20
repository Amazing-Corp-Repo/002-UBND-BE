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
                  startTime: "07:30",
                  endTime: "08:30",
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
                  startTime: "07:30",
                  endTime: "08:30",
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
    patch: {
      tags: ["ReceptionCounterAssignment"],
      summary: "Cập nhật một phân công cán bộ - quầy",
      description:
        "Đổi cán bộ chính hoặc bật/tắt một phân công. Khi kích hoạt, backend kiểm tra một quầy chỉ có một cán bộ chính và một cán bộ chỉ trực một quầy trong cùng ca. Yêu cầu quyền LTD_UPDATE.",
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
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                officerId: { type: "string", format: "uuid" },
                isActive: { type: "boolean" },
              },
              minProperties: 1,
            },
            examples: {
              changeOfficer: {
                summary: "Đổi cán bộ trực quầy",
                value: { officerId: "523e4567-e89b-42d3-a456-426614174001" },
              },
              deactivate: {
                summary: "Ngừng phân công",
                value: { isActive: false },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Cập nhật phân công quầy thành công" },
        400: { description: "Dữ liệu sai hoặc cán bộ không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LTD_UPDATE" },
        404: { description: "Phân công quầy tiếp dân không tồn tại" },
        409: { description: "Trùng cán bộ, trùng quầy hoặc xung đột cập nhật đồng thời" },
      },
    },
    delete: {
      tags: ["ReceptionCounterAssignment"],
      summary: "Xóa mềm một phân công cán bộ - quầy",
      description:
        "Ngừng hoạt động và đánh dấu xóa logic phân công để vẫn giữ lịch sử dữ liệu. Yêu cầu quyền LTD_UPDATE.",
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
        200: { description: "Xóa phân công quầy thành công" },
        400: { description: "ID phân công không đúng định dạng UUID" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LTD_UPDATE" },
        404: { description: "Phân công quầy tiếp dân không tồn tại" },
      },
    },
  },
  "/api/reception-shifts/{shiftId}/counter-assignments": {
    put: {
      tags: ["ReceptionCounterAssignment"],
      summary: "Thiết lập phân công cán bộ - quầy cho một ca",
      description:
        "Thay thế toàn bộ phân công đang hoạt động của ca bằng danh sách mới. Một quầy chỉ có một cán bộ chính và một cán bộ chỉ trực một quầy trong cùng ca. Gửi mảng rỗng để ngừng toàn bộ phân công của ca. Yêu cầu quyền LTD_UPDATE.",
      security: [{ bearerAuth: [] }],
      parameters: [{
        name: "shiftId",
        in: "path",
        required: true,
        description: "ID ca tiếp dân",
        schema: {
          type: "string",
          format: "uuid",
          example: "323e4567-e89b-42d3-a456-426614174001",
        },
      }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["assignments"],
              properties: {
                assignments: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["counterConfigurationId", "officerId"],
                    properties: {
                      counterConfigurationId: { type: "string", format: "uuid" },
                      officerId: { type: "string", format: "uuid" },
                    },
                  },
                },
              },
            },
            example: {
              assignments: [{
                counterConfigurationId: "223e4567-e89b-42d3-a456-426614174001",
                officerId: "523e4567-e89b-42d3-a456-426614174001",
              }],
            },
          },
        },
      },
      responses: {
        200: { description: "Cập nhật phân công quầy theo ca thành công" },
        400: { description: "Dữ liệu sai hoặc quầy/cán bộ không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LTD_UPDATE" },
        404: { description: "Ca tiếp dân không tồn tại hoặc đã ngừng hoạt động" },
        409: { description: "Trùng quầy, trùng cán bộ hoặc xung đột cập nhật đồng thời" },
      },
    },
  },
};

export default ReceptionCounterAssignmentSwagger;
