const registrationRequestSchema = {
  type: "object",
  required: [
    "idLichTiepDan",
    "slot",
    "chuDe",
    "lyDo",
    "hoTen",
    "sdt",
    "cccd",
    "diaChi",
  ],
  properties: {
    idLichTiepDan: { type: "string", format: "uuid" },
    slot: { type: "string", example: "08:00 - 09:00" },
    chuDe: { type: "string", maxLength: 255, example: "Hướng dẫn thủ tục" },
    lyDo: { type: "string", minLength: 10, maxLength: 500 },
    hoTen: { type: "string", maxLength: 150, example: "Nguyễn Văn An" },
    sdt: { type: "string", pattern: "^(03|05|07|08|09)\\d{8}$", example: "0912345678" },
    cccd: { type: "string", pattern: "^\\d{12}$", example: "042204001234" },
    diaChi: { type: "string", maxLength: 500 },
  },
};

const DangKyTiepDanSwagger = {
  "/api/reception-registrations": {
    get: {
      tags: ["ReceptionRegistration"],
      summary: "Get reception registrations for staff",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        { name: "size", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
        { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
        { name: "receptionDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "approvalStatus", in: "query", schema: { type: "string", example: "PENDING" } },
        { name: "ratingStatus", in: "query", schema: { type: "string", enum: ["RATED", "NOT_RATED"] } },
        { name: "department", in: "query", schema: { type: "string", enum: ["QUAY_1", "QUAY_2", "QUAY_3", "QUAY_4", "QUAY_5", "QUAY_6", "QUAY_7", "QUAY_8"] } },
      ],
      responses: {
        200: { description: "Paginated reception registrations" },
        401: { description: "Missing or invalid access token" },
        403: { description: "Missing RR_GET_ALL permission" },
      },
    },
    post: {
      tags: ["ReceptionRegistration"],
      summary: "Đăng ký lịch tiếp dân tại quầy từ Mobile",
      description:
        "API công khai. BE kiểm tra lịch hoạt động, chống trùng theo lịch/khung giờ/số điện thoại và tự sinh mã tiếp dân ngắn, ví dụ A00123.",
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: registrationRequestSchema },
        },
      },
      responses: {
        200: { description: "Đăng ký thành công" },
        400: { description: "Thiếu hoặc sai dữ liệu, hoặc lịch đã qua" },
        404: { description: "Lịch tiếp dân không tồn tại hoặc đã ngừng hoạt động" },
        409: { description: "Số điện thoại đã đăng ký cùng lịch và khung giờ" },
      },
    },
  },
  "/api/reception-registrations/lookup": {
    post: {
      tags: ["ReceptionRegistration"],
      summary: "Look up citizen reception registrations",
      description:
        "Public Mobile lookup using exactly one reception code or phone number. Sensitive identity fields are masked in the response.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              oneOf: [
                {
                  type: "object",
                  required: ["receptionCode"],
                  properties: {
                    receptionCode: { type: "string", example: "A00123" },
                  },
                  additionalProperties: false,
                },
                {
                  type: "object",
                  required: ["phoneNumber"],
                  properties: {
                    phoneNumber: { type: "string", example: "0912345678" },
                  },
                  additionalProperties: false,
                },
              ],
            },
          },
        },
      },
      responses: {
        200: { description: "Matching registrations" },
        400: { description: "Invalid lookup input" },
        404: { description: "No registration found" },
      },
    },
  },
  "/api/reception-registrations/{id}": {
    get: {
      tags: ["ReceptionRegistration"],
      summary: "Get reception registration details for staff",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {
        200: { description: "Full citizen-submitted registration details" },
        400: { description: "Invalid registration ID" },
        401: { description: "Missing or invalid access token" },
        403: { description: "Missing RR_GET_DETAIL permission" },
        404: { description: "Registration not found" },
      },
    },
  },
  "/api/reception-registrations/{id}/approve": {
    patch: {
      tags: ["ReceptionRegistration"],
      summary: "Approve a reception registration",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["department"],
              properties: {
                department: {
                  type: "string",
                  enum: ["QUAY_1", "QUAY_2", "QUAY_3", "QUAY_4", "QUAY_5", "QUAY_6", "QUAY_7", "QUAY_8"],
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Registration approved" },
        400: { description: "Invalid ID or department" },
        401: { description: "Missing or invalid access token" },
        403: { description: "Missing RR_APPROVE permission" },
        404: { description: "Registration or approver not found" },
        409: { description: "Registration is not pending or was concurrently processed" },
      },
    },
  },
};

export default DangKyTiepDanSwagger;
