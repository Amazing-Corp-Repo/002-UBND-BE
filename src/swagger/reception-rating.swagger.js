import {
  applyReceptionDemoExamples,
  errorDemo,
  successDemo,
} from "./reception-demo-example.util.js";
import { RECEPTION_SWAGGER_DEMO as DEMO } from "./reception-swagger-demo.fixture.js";

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
        200: {
          description: "Lấy danh sách đánh giá tiếp dân thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["success", "data", "message", "pagination"],
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        receptionCode: { type: "string", example: "A00123" },
                        applicantName: { type: "string", example: "Nguyễn Văn An" },
                        department: {
                          type: "string",
                          enum: [
                            "QUAY_1",
                            "QUAY_2",
                            "QUAY_3",
                            "QUAY_4",
                            "QUAY_5",
                            "QUAY_6",
                            "QUAY_7",
                            "QUAY_8",
                          ],
                        },
                        receptionDate: { type: "string", format: "date-time" },
                        timeSlot: { type: "string", example: "08:00 - 09:00" },
                        topic: { type: "string", example: "Hướng dẫn thủ tục" },
                        score: { type: "integer", minimum: 1, maximum: 5 },
                        selectedSuggestions: {
                          type: "array",
                          items: { type: "string" },
                        },
                        comment: { type: "string", maxLength: 2000 },
                        ratedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  message: {
                    type: "string",
                    example: "Lấy danh sách đánh giá tiếp dân thành công",
                  },
                  pagination: {
                    type: "object",
                    properties: {
                      currentPage: { type: "integer", minimum: 1 },
                      pageSize: { type: "integer", minimum: 1, maximum: 100 },
                      totalPages: { type: "integer", minimum: 0 },
                      totalItems: { type: "integer", minimum: 0 },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Bộ lọc không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền RRT_GET_ALL" },
      },
    },
    post: {
      tags: ["ReceptionRating"],
      summary: "Gửi đánh giá tiếp dân từ iPad",
      description:
        "API công khai dành cho iPad. Chỉ đăng ký ở trạng thái COMPLETED mới được đánh giá và mỗi mã tiếp dân chỉ được đánh giá một lần. Nội dung gợi ý được chọn phải thuộc cấu hình của số sao đã gửi. Giới hạn 20 yêu cầu gửi đánh giá trong 10 phút cho mỗi IP.",
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
        200: {
          description: "Gửi đánh giá tiếp dân thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      receptionCode: { type: "string", example: "A00123" },
                      score: { type: "integer", minimum: 1, maximum: 5 },
                      selectedSuggestions: {
                        type: "array",
                        maxItems: 5,
                        uniqueItems: true,
                        items: { type: "string" },
                      },
                      comment: { type: "string", maxLength: 2000 },
                      createdAt: { type: "string", format: "date-time" },
                    },
                  },
                  message: {
                    type: "string",
                    example: "Gửi đánh giá tiếp dân thành công",
                  },
                },
              },
            },
          },
        },
        400: { description: "Thiếu dữ liệu hoặc dữ liệu đánh giá không hợp lệ" },
        404: { description: "Không tìm thấy mã tiếp dân" },
        409: { description: "Buổi tiếp dân chưa hoàn thành hoặc mã đã được đánh giá" },
        429: { description: "Vượt quá 20 yêu cầu gửi đánh giá trong 10 phút từ cùng một IP" },
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
        200: {
          description: "Lấy cấu hình đánh giá tiếp dân thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      scale: {
                        type: "object",
                        properties: {
                          min: { type: "integer", enum: [1] },
                          max: { type: "integer", enum: [5] },
                        },
                      },
                      comment: {
                        type: "object",
                        properties: {
                          maxLength: { type: "integer", enum: [2000] },
                        },
                      },
                      suggestionsByScore: {
                        type: "object",
                        required: ["1", "2", "3", "4", "5"],
                        properties: {
                          1: { type: "array", items: { type: "string" } },
                          2: { type: "array", items: { type: "string" } },
                          3: { type: "array", items: { type: "string" } },
                          4: { type: "array", items: { type: "string" } },
                          5: { type: "array", items: { type: "string" } },
                        },
                      },
                    },
                  },
                  message: {
                    type: "string",
                    example: "Lấy cấu hình đánh giá tiếp dân thành công",
                  },
                },
              },
            },
          },
        },
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
        200: {
          description: "Lấy chi tiết đánh giá tiếp dân thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["success", "data", "message"],
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      score: { type: "integer", minimum: 1, maximum: 5 },
                      selectedSuggestions: {
                        type: "array",
                        items: { type: "string" },
                      },
                      comment: { type: "string", maxLength: 2000 },
                      ratedAt: { type: "string", format: "date-time" },
                      registration: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          receptionCode: { type: "string", example: "A00123" },
                          receptionDate: { type: "string", format: "date-time" },
                          timeSlot: { type: "string", example: "08:00 - 09:00" },
                          topic: { type: "string", example: "Hướng dẫn thủ tục" },
                          workingContent: { type: "string" },
                          applicant: {
                            type: "object",
                            properties: {
                              fullName: { type: "string" },
                              phoneNumber: { type: "string" },
                              citizenId: { type: "string" },
                              address: { type: "string" },
                            },
                          },
                          department: {
                            type: "string",
                            enum: [
                              "QUAY_1",
                              "QUAY_2",
                              "QUAY_3",
                              "QUAY_4",
                              "QUAY_5",
                              "QUAY_6",
                              "QUAY_7",
                              "QUAY_8",
                            ],
                          },
                          approvalStatus: {
                            type: "string",
                            enum: ["PENDING", "APPROVED", "COMPLETED", "REJECTED"],
                          },
                          approver: {
                            type: "object",
                            nullable: true,
                            properties: {
                              name: { type: "string" },
                              title: { type: "string", nullable: true },
                              approvedAt: { type: "string", format: "date-time" },
                            },
                          },
                          schedule: {
                            type: "object",
                            nullable: true,
                            properties: {
                              id: { type: "string", format: "uuid" },
                              officerName: { type: "string" },
                              location: { type: "string" },
                              receptionDate: { type: "string", format: "date-time" },
                              timeRange: { type: "string" },
                              note: { type: "string", nullable: true },
                            },
                          },
                        },
                      },
                    },
                  },
                  message: {
                    type: "string",
                    example: "Lấy chi tiết đánh giá tiếp dân thành công",
                  },
                  pagination: { nullable: true, example: null },
                },
              },
            },
          },
        },
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
        {
          name: "department",
          in: "query",
          schema: {
            type: "string",
            enum: [
              "QUAY_1",
              "QUAY_2",
              "QUAY_3",
              "QUAY_4",
              "QUAY_5",
              "QUAY_6",
              "QUAY_7",
              "QUAY_8",
            ],
          },
        },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        200: {
          description: "Lấy thống kê đánh giá tiếp dân thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["success", "data", "message"],
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      totalRatings: { type: "integer", minimum: 0 },
                      averageScore: {
                        type: "number",
                        format: "double",
                        minimum: 0,
                        maximum: 5,
                      },
                      satisfactionRate: {
                        type: "number",
                        format: "double",
                        minimum: 0,
                        maximum: 100,
                        description: "Tỷ lệ phần trăm đánh giá từ 4 đến 5 sao",
                      },
                      scoreDistribution: {
                        type: "array",
                        minItems: 5,
                        maxItems: 5,
                        items: {
                          type: "object",
                          properties: {
                            score: { type: "integer", minimum: 1, maximum: 5 },
                            count: { type: "integer", minimum: 0 },
                          },
                        },
                      },
                      byDepartment: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            department: { type: "string", example: "QUAY_1" },
                            totalRatings: { type: "integer", minimum: 0 },
                            averageScore: {
                              type: "number",
                              format: "double",
                              minimum: 0,
                              maximum: 5,
                            },
                          },
                        },
                      },
                    },
                  },
                  message: {
                    type: "string",
                    example: "Lấy thống kê đánh giá tiếp dân thành công",
                  },
                  pagination: { nullable: true, example: null },
                },
              },
            },
          },
        },
        400: { description: "Bộ lọc không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền RRT_GET_STATS" },
      },
    },
  },
};

const ratingDemo = {
  id: "423e4567-e89b-42d3-a456-426614174000",
  receptionCode: "A00123",
  applicantName: "Nguyễn Văn An",
  department: "QUAY_3",
  receptionDate: "2026-08-26T00:00:00.000Z",
  timeSlot: "07:30 - 08:30",
  topic: "Hướng dẫn thủ tục hành chính",
  score: 5,
  selectedSuggestions: [
    "Cán bộ rất tận tình và chuyên nghiệp",
    "Yêu cầu được giải thích đầy đủ, rõ ràng",
  ],
  comment: "Tôi hài lòng với quá trình tiếp dân.",
  ratedAt: "2026-08-26T08:35:00.000Z",
};

applyReceptionDemoExamples(ReceptionRatingSwagger, {
  "GET /api/reception-ratings": {
    parameters: {
      page: 1,
      size: 10,
      search: DEMO.registrations.rated.code,
      score: null,
      department: null,
      fromDate: null,
      toDate: null,
    },
    responses: {
      200: successDemo(
        "Lấy danh sách đánh giá tiếp dân thành công",
        [ratingDemo],
        { currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 1 }
      ),
      400: errorDemo(
        "Demo 400 - Khoảng ngày không hợp lệ",
        "Ngày bắt đầu không được sau ngày kết thúc"
      ),
    },
  },
  "POST /api/reception-ratings": {
    request: {
      validFiveStarRating: {
        summary: "Demo hợp lệ - đánh giá 5 sao",
        value: {
          receptionCode: DEMO.registrations.ratingCreate.code,
          score: 5,
          selectedSuggestions: [
            "Cán bộ rất tận tình và chuyên nghiệp",
            "Yêu cầu được giải thích đầy đủ, rõ ràng",
          ],
          comment: "Tôi hài lòng với quá trình tiếp dân.",
        },
      },
      missingScore: {
        summary: "Demo lỗi 400 - thiếu số sao",
        value: { receptionCode: DEMO.registrations.ratingCreate.code },
      },
      suggestionDoesNotMatchScore: {
        summary: "Demo lỗi 400 - gợi ý không đúng số sao",
        value: {
          receptionCode: DEMO.registrations.ratingCreate.code,
          score: 1,
          selectedSuggestions: ["Cán bộ rất tận tình và chuyên nghiệp"],
        },
      },
    },
    responses: {
      200: successDemo("Gửi đánh giá tiếp dân thành công", {
        id: ratingDemo.id,
        receptionCode: ratingDemo.receptionCode,
        score: ratingDemo.score,
        selectedSuggestions: ratingDemo.selectedSuggestions,
        comment: ratingDemo.comment,
        createdAt: ratingDemo.ratedAt,
      }),
      400: {
        missingData: errorDemo(
          "Demo 400 - Thiếu dữ liệu bắt buộc",
          "Dữ liệu không hợp lệ",
          [{ field: "score", message: "Điểm đánh giá là bắt buộc" }]
        ),
        invalidSuggestion: errorDemo(
          "Demo 400 - Gợi ý không đúng số sao",
          "Gợi ý đã chọn không phù hợp với số sao đánh giá"
        ),
      },
      404: errorDemo(
        "Demo 404 - Mã tiếp dân không tồn tại",
        "Không tìm thấy mã tiếp dân"
      ),
      409: {
        notCompleted: errorDemo(
          "Demo 409 - Buổi tiếp chưa hoàn thành",
          "Buổi tiếp dân chưa hoàn thành để đánh giá"
        ),
        duplicateRating: errorDemo(
          "Demo 409 - Đã đánh giá trước đó",
          "Mã tiếp dân đã được đánh giá"
        ),
      },
    },
  },
  "GET /api/reception-ratings/configuration": {
    responses: {
      200: successDemo("Lấy cấu hình đánh giá tiếp dân thành công", {
        scale: { min: 1, max: 5 },
        comment: { maxLength: 2000 },
        suggestionsByScore: {
          1: ["Cán bộ đã tiếp nhận ý kiến của tôi"],
          2: ["Cán bộ có lắng nghe ý kiến"],
          3: ["Cán bộ giao tiếp lịch sự"],
          4: ["Cán bộ nhiệt tình và tôn trọng"],
          5: ["Cán bộ rất tận tình và chuyên nghiệp"],
        },
      }),
    },
  },
  "GET /api/reception-ratings/{id}": {
    parameters: { id: DEMO.ratingId },
    responses: {
      200: successDemo("Lấy chi tiết đánh giá tiếp dân thành công", {
        id: ratingDemo.id,
        score: ratingDemo.score,
        selectedSuggestions: ratingDemo.selectedSuggestions,
        comment: ratingDemo.comment,
        ratedAt: ratingDemo.ratedAt,
        registration: {
          receptionCode: ratingDemo.receptionCode,
          receptionDate: ratingDemo.receptionDate,
          timeSlot: ratingDemo.timeSlot,
          topic: ratingDemo.topic,
          department: ratingDemo.department,
          approvalStatus: "COMPLETED",
          applicant: {
            fullName: "Nguyễn Văn An",
            phoneNumber: "0912345678",
            citizenId: "042204001234",
            address: "Phường Thành Sen, tỉnh Hà Tĩnh",
          },
        },
      }),
      404: errorDemo(
        "Demo 404 - Không tìm thấy đánh giá",
        "Đánh giá tiếp dân không tồn tại"
      ),
    },
  },
  "GET /api/reception-ratings/statistics": {
    parameters: {
      department: "QUAY_5",
      fromDate: DEMO.dates.main,
      toDate: DEMO.dates.main,
    },
    responses: {
      200: successDemo("Lấy thống kê đánh giá tiếp dân thành công", {
        totalRatings: 4,
        averageScore: 4.25,
        satisfactionRate: 75,
        scoreDistribution: [
          { score: 1, count: 0 },
          { score: 2, count: 0 },
          { score: 3, count: 1 },
          { score: 4, count: 1 },
          { score: 5, count: 2 },
        ],
        byDepartment: [{ department: "QUAY_3", totalRatings: 4, averageScore: 4.25 }],
      }),
      400: errorDemo(
        "Demo 400 - Quầy không hợp lệ",
        "Dữ liệu không hợp lệ",
        [{ field: "department", message: "Bộ phận phải từ QUAY_1 đến QUAY_8" }]
      ),
    },
  },
});

export default ReceptionRatingSwagger;
