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
      summary: "Lấy danh sách đăng ký tiếp dân dành cho cán bộ",
      description:
        "Trả về danh sách đăng ký tiếp dân có phân trang. Hỗ trợ tìm kiếm và lọc theo ngày tiếp, trạng thái phê duyệt, trạng thái đánh giá và quầy tiếp nhận.",
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
        200: { description: "Lấy danh sách đăng ký tiếp dân thành công" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền RR_GET_ALL" },
      },
    },
    post: {
      tags: ["ReceptionRegistration"],
      summary: "Đăng ký lịch tiếp dân tại quầy từ Mobile",
      description:
        "API công khai. BE kiểm tra slot thuộc lịch và còn chỗ trước khi lưu. Mọi đơn PENDING, APPROVED, COMPLETED, REJECTED hoặc đã xoá mềm đều giữ chỗ và không hoàn lại. Mỗi số điện thoại và mỗi CCCD được tạo tối đa 2 đơn trong cùng ngày tiếp dân. Giới hạn 30 request trong 10 phút cho mỗi IP. Hệ thống tự sinh mã tiếp dân ngắn, ví dụ A00123.",
      requestBody: {
        required: true,
        content: {
          "application/json": { schema: registrationRequestSchema },
        },
      },
      responses: {
        200: { description: "Đăng ký thành công" },
        400: { description: "Thiếu hoặc sai dữ liệu, lịch đã qua hoặc khung giờ không thuộc lịch" },
        404: { description: "Lịch tiếp dân không tồn tại hoặc đã ngừng hoạt động" },
        409: { description: "Khung giờ đã đầy, đăng ký trùng hoặc SĐT/CCCD đã đạt giới hạn 2 đơn trong ngày" },
        429: { description: "Vượt quá 30 request đăng ký trong 10 phút từ cùng một IP" },
      },
    },
  },
  "/api/reception-registrations/lookup": {
    post: {
      tags: ["ReceptionRegistration"],
      summary: "Tra cứu đăng ký tiếp dân của người dân",
      description:
        "API công khai dành cho Mobile. Chỉ sử dụng một trong hai thông tin là mã tiếp dân hoặc số điện thoại. Các trường định danh nhạy cảm được che một phần trong kết quả.",
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
        200: { description: "Tra cứu đăng ký tiếp dân thành công" },
        400: { description: "Thông tin tra cứu không hợp lệ" },
        404: { description: "Không tìm thấy đăng ký tiếp dân" },
      },
    },
  },
  "/api/reception-registrations/{id}": {
    get: {
      tags: ["ReceptionRegistration"],
      summary: "Lấy chi tiết đăng ký tiếp dân dành cho cán bộ",
      description:
        "Trả về đầy đủ thông tin người dân đã đăng ký để cán bộ kiểm tra khi bấm vào mã tiếp dân.",
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
        200: { description: "Lấy chi tiết đăng ký tiếp dân thành công" },
        400: { description: "ID đăng ký tiếp dân không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền RR_GET_DETAIL" },
        404: { description: "Không tìm thấy đăng ký tiếp dân" },
      },
    },
  },
  "/api/reception-registrations/{id}/approve": {
    patch: {
      tags: ["ReceptionRegistration"],
      summary: "Phê duyệt đăng ký tiếp dân",
      description:
        "Cán bộ phê duyệt yêu cầu gặp và gán đăng ký vào một trong tám quầy tiếp nhận. Backend kiểm tra sức chứa riêng của quầy trong đúng ca; nếu quầy đã đầy thì cán bộ phải chọn quầy khác. Hệ thống tự ghi nhận người duyệt và thời điểm duyệt.",
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
        200: { description: "Phê duyệt đăng ký tiếp dân thành công" },
        400: { description: "ID đăng ký hoặc quầy tiếp nhận không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền RR_APPROVE" },
        404: { description: "Không tìm thấy đăng ký hoặc người phê duyệt" },
        409: { description: "Đăng ký không ở trạng thái chờ duyệt, đã được xử lý hoặc quầy được chọn đã đầy" },
      },
    },
  },
  "/api/reception-registrations/rating-lookup/{receptionCode}": {
    get: {
      tags: ["ReceptionRegistration"],
      summary: "Tra cứu đăng ký đã duyệt để đánh giá trên iPad",
      description:
        "API công khai dành cho iPad. Chỉ trả về đăng ký đã được phê duyệt, đã gán từ QUAY_1 đến QUAY_8 và chưa được đánh giá.",
      parameters: [
        {
          name: "receptionCode",
          in: "path",
          required: true,
          schema: { type: "string", example: "A00123" },
        },
      ],
      responses: {
        200: { description: "Lấy thông tin để người dân xác nhận thành công" },
        400: { description: "Mã tiếp dân không hợp lệ" },
        404: { description: "Không tìm thấy mã tiếp dân" },
        409: { description: "Đăng ký chưa được duyệt, chưa gán quầy hoặc đã được đánh giá" },
      },
    },
  },
};

export default DangKyTiepDanSwagger;
