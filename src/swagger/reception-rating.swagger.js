const ReceptionRatingSwagger = {
  "/api/reception-ratings": {
    get: {
      tags: ["ReceptionRating"],
      summary: "Lấy danh sách đánh giá tiếp dân dành cho lãnh đạo",
      description:
        "Trả về danh sách đánh giá có phân trang. Hỗ trợ tìm kiếm và lọc theo số sao, quầy tiếp nhận và khoảng ngày đánh giá.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        { name: "size", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
        { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
        { name: "score", in: "query", schema: { type: "integer", minimum: 1, maximum: 5 } },
        { name: "department", in: "query", schema: { type: "string", example: "QUAY_1" } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        200: { description: "Lấy danh sách đánh giá tiếp dân thành công" },
        400: { description: "Bộ lọc không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền RRT_GET_ALL" },
      },
    },
    post: {
      tags: ["ReceptionRating"],
      summary: "Gửi đánh giá tiếp dân từ iPad",
      description:
        "API công khai dành cho iPad. Mỗi mã tiếp dân chỉ được đánh giá một lần. Nội dung gợi ý được chọn phải thuộc cấu hình của số sao đã gửi.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["receptionCode", "score"],
              properties: {
                receptionCode: { type: "string", example: "A00123" },
                score: { type: "integer", minimum: 1, maximum: 5 },
                selectedSuggestions: {
                  type: "array",
                  maxItems: 5,
                  uniqueItems: true,
                  items: { type: "string", maxLength: 200 },
                },
                comment: { type: "string", maxLength: 2000 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Gửi đánh giá tiếp dân thành công" },
        400: { description: "Thiếu dữ liệu hoặc dữ liệu đánh giá không hợp lệ" },
        404: { description: "Không tìm thấy mã tiếp dân" },
        409: { description: "Đăng ký chưa đủ điều kiện hoặc đã được đánh giá" },
      },
    },
  },
  "/api/reception-ratings/configuration": {
    get: {
      tags: ["ReceptionRating"],
      summary: "Lấy cấu hình đánh giá tiếp dân dành cho iPad",
      description:
        "Trả về thang điểm từ 1 đến 5 sao, giới hạn nhận xét 2000 ký tự và danh sách nội dung gợi ý tương ứng với từng mức sao.",
      responses: {
        200: { description: "Lấy cấu hình đánh giá tiếp dân thành công" },
      },
    },
  },
  "/api/reception-ratings/{id}": {
    get: {
      tags: ["ReceptionRating"],
      summary: "Lấy chi tiết đánh giá tiếp dân dành cho lãnh đạo",
      description:
        "Trả về nội dung đánh giá cùng thông tin đăng ký tiếp dân gốc để lãnh đạo kiểm tra.",
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
        200: { description: "Lấy chi tiết đánh giá tiếp dân thành công" },
        400: { description: "ID đánh giá không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền RRT_GET_DETAIL" },
        404: { description: "Không tìm thấy đánh giá tiếp dân" },
      },
    },
  },
  "/api/reception-ratings/statistics": {
    get: {
      tags: ["ReceptionRating"],
      summary: "Lấy thống kê cơ bản về đánh giá tiếp dân",
      description:
        "Thống kê tổng lượt đánh giá, điểm trung bình, tỷ lệ hài lòng, phân bố số sao và kết quả theo từng quầy tiếp nhận.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "department", in: "query", schema: { type: "string", example: "QUAY_1" } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        200: { description: "Lấy thống kê đánh giá tiếp dân thành công" },
        400: { description: "Bộ lọc không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền RRT_GET_STATS" },
      },
    },
  },
};

export default ReceptionRatingSwagger;
