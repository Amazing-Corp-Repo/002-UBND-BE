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
};

export default DangKyTiepDanSwagger;
