const PhanAnhRatingSwagger = {
  "/api/phan-anh-ratings": {
    get: {
      tags: ["PhanAnhRating"],
      summary: "Lấy danh sách đánh giá phản ánh theo phạm vi lĩnh vực",
      description: "Yêu cầu quyền PART_GET_ALL. Nếu không có PA_THUONG_TRUC, dữ liệu bị giới hạn bởi cate trong token.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
        { name: "score", in: "query", schema: { type: "integer", minimum: 1, maximum: 5 } },
        { name: "idLinhVucPhanAnh", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
      ],
      responses: {
        200: { description: "Lấy danh sách đánh giá phản ánh thành công" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền PART_GET_ALL hoặc ngoài phạm vi lĩnh vực" },
      },
    },
    post: {
      tags: ["PhanAnhRating"],
      summary: "Người dân gửi đánh giá phản ánh",
      description: "API công khai, không cần đăng nhập hay OTP. Chỉ phản ánh có trạng thái mới nhất là Đã giải quyết được đánh giá; mỗi mã chỉ một lần. Giới hạn 20 yêu cầu/10 phút/IP.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["complaintCode", "score"],
              properties: {
                complaintCode: { type: "string", pattern: "^[A-Z0-9]{8}$", example: "A1B2C3D4" },
                score: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                comment: { type: "string", maxLength: 2000, example: "Phản ánh đã được xử lý rõ ràng." },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Gửi đánh giá phản ánh thành công" },
        400: { description: "Dữ liệu đánh giá không hợp lệ" },
        404: { description: "Không tìm thấy mã phản ánh" },
        409: { description: "Phản ánh chưa được giải quyết hoặc đã được đánh giá" },
        429: { description: "Vượt quá 20 yêu cầu trong 10 phút trên một IP" },
      },
    },
  },
  "/api/phan-anh-ratings/configuration": {
    get: {
      tags: ["PhanAnhRating"],
      summary: "Lấy cấu hình đánh giá phản ánh cho người dân",
      description: "API công khai trả thang điểm 1-5, giới hạn nhận xét 2000 ký tự và trạng thái đủ điều kiện đánh giá.",
      responses: { 200: { description: "Lấy cấu hình đánh giá phản ánh thành công" } },
    },
  },
  "/api/phan-anh-ratings/by-code/{complaintCode}": {
    get: {
      tags: ["PhanAnhRating"],
      summary: "Kiểm tra và lấy thông tin đánh giá của phản ánh theo mã",
      description: "API công khai cho người dân kiểm tra trạng thái đánh giá phản ánh.",
      parameters: [{ name: "complaintCode", in: "path", required: true, schema: { type: "string", pattern: "^[A-Z0-9]{8}$", example: "PA260010" } }],
      responses: { 200: { description: "Lấy thông tin đánh giá phản ánh thành công" }, 400: { description: "Mã phản ánh không hợp lệ" }, 404: { description: "Không tìm thấy mã phản ánh" } },
    },
  },
  "/api/phan-anh-ratings/statistics": {
    get: {
      tags: ["PhanAnhRating"],
      summary: "Thống kê đánh giá phản ánh theo phạm vi lĩnh vực",
      description: "Yêu cầu quyền PART_GET_STATS; áp dụng phạm vi cate khi tài khoản không có PA_THUONG_TRUC.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "idLinhVucPhanAnh", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        200: { description: "Lấy thống kê đánh giá phản ánh thành công" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền PART_GET_STATS hoặc ngoài phạm vi lĩnh vực" },
      },
    },
  },
  "/api/phan-anh-ratings/{id}": {
    get: {
      tags: ["PhanAnhRating"],
      summary: "Lấy chi tiết đánh giá phản ánh",
      description: "Yêu cầu quyền PART_GET_DETAIL; không trả số điện thoại, tên người phản ánh hoặc ghi chú nội bộ.",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        200: { description: "Lấy chi tiết đánh giá phản ánh thành công" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền PART_GET_DETAIL" },
        404: { description: "Đánh giá phản ánh không tồn tại hoặc ngoài phạm vi lĩnh vực" },
      },
    },
  },
};

export default PhanAnhRatingSwagger;
