import {
  applyReceptionDemoExamples,
  errorDemo,
  successDemo,
} from "./reception-demo-example.util.js";
import { RECEPTION_SWAGGER_DEMO as DEMO } from "./reception-swagger-demo.fixture.js";

const counterEnum = Array.from({ length: 8 }, (_, index) => `QUAY_${index + 1}`);

const manualRatingProperties = {
  id: { type: "string", format: "uuid" },
  receptionCode: { type: "string", example: "TD-20260822-001" },
  citizenName: { type: "string", example: "Nguyễn Văn An" },
  applicantName: {
    type: "string",
    example: "Nguyễn Văn An",
    description: "Alias tương thích cho citizenName",
  },
  officerName: { type: "string", example: "Trần Thị Bình" },
  counterCode: { type: "string", enum: counterEnum, example: "QUAY_2" },
  department: {
    type: "string",
    enum: counterEnum,
    example: "QUAY_2",
    description: "Alias tương thích cho counterCode",
  },
  receptionDate: { type: "string", format: "date", example: "2026-08-22" },
  timeSlot: { type: "string", example: "08:30 - 09:30" },
  workingContent: {
    type: "string",
    example: "Hướng dẫn thủ tục hành chính",
  },
  topic: {
    type: "string",
    description: "Alias tương thích cho workingContent",
  },
  score: { type: "integer", minimum: 1, maximum: 5, example: 5 },
  selectedSuggestions: {
    type: "array",
    minItems: 1,
    maxItems: 5,
    uniqueItems: true,
    items: { type: "string" },
  },
  comment: { type: "string", minLength: 1, maxLength: 2000 },
  ratedAt: { type: "string", format: "date-time" },
  createdAt: {
    type: "string",
    format: "date-time",
    description: "Alias tương thích cho ratedAt",
  },
};

const successEnvelope = (data) => ({
  type: "object",
  required: ["success", "data", "message"],
  properties: {
    success: { type: "boolean", example: true },
    data,
    message: { type: "string" },
    pagination: { nullable: true },
  },
});

const ReceptionRatingSwagger = {
  "/api/reception-ratings": {
    get: {
      tags: ["ReceptionRating"],
      summary: "Lấy danh sách đánh giá tiếp dân dành cho lãnh đạo",
      description:
        "Trả dữ liệu tiếp dân do cán bộ nhập thủ công trên iPad, có phân trang và lọc. Yêu cầu quyền RRT_GET_ALL.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        { name: "size", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
        {
          name: "search",
          in: "query",
          description: "Tìm theo mã tiếp dân, người dân, cán bộ, nội dung làm việc hoặc nhận xét",
          schema: { type: "string", maxLength: 100 },
        },
        { name: "score", in: "query", schema: { type: "integer", minimum: 1, maximum: 5 } },
        { name: "department", in: "query", schema: { type: "string", enum: counterEnum } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        200: {
          description: "Lấy danh sách đánh giá tiếp dân thành công",
          content: {
            "application/json": {
              schema: {
                ...successEnvelope({
                  type: "array",
                  items: { type: "object", properties: manualRatingProperties },
                }),
                required: ["success", "data", "message", "pagination"],
                properties: {
                  ...successEnvelope({}).properties,
                  data: {
                    type: "array",
                    items: { type: "object", properties: manualRatingProperties },
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
      summary: "Gửi đánh giá tiếp dân nhập thủ công từ iPad",
      description:
        "API công khai, không cần đăng nhập. Cán bộ nhập toàn bộ thông tin phiên tiếp dân; backend không đối chiếu đăng ký, lịch, ca, quầy hoặc cán bộ với DB. Mã tiếp dân phải duy nhất. Giới hạn 20 yêu cầu trong 10 phút cho mỗi IP.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              additionalProperties: false,
              required: [
                "receptionCode",
                "citizenName",
                "officerName",
                "counterCode",
                "receptionDate",
                "timeSlot",
                "workingContent",
                "score",
                "selectedSuggestions",
                "comment",
              ],
              properties: {
                receptionCode: {
                  type: "string",
                  minLength: 4,
                  maxLength: 50,
                  pattern: "^[A-Z0-9-]+$",
                  example: "TD-20260822-001",
                },
                citizenName: { type: "string", minLength: 2, maxLength: 150 },
                officerName: { type: "string", minLength: 2, maxLength: 150 },
                counterCode: { type: "string", enum: counterEnum },
                receptionDate: { type: "string", format: "date" },
                timeSlot: {
                  type: "string",
                  pattern: "^([01]\\d|2[0-3]):[0-5]\\d\\s-\\s([01]\\d|2[0-3]):[0-5]\\d$",
                  example: "08:30 - 09:30",
                },
                workingContent: { type: "string", minLength: 1 },
                score: { type: "integer", minimum: 1, maximum: 5 },
                selectedSuggestions: {
                  type: "array",
                  minItems: 1,
                  maxItems: 5,
                  uniqueItems: true,
                  items: { type: "string", maxLength: 200 },
                },
                comment: { type: "string", minLength: 1, maxLength: 2000 },
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
              schema: successEnvelope({
                type: "object",
                properties: manualRatingProperties,
              }),
            },
          },
        },
        400: { description: "Thiếu dữ liệu hoặc dữ liệu nhập thủ công không hợp lệ" },
        409: { description: "Mã tiếp dân đã được đánh giá" },
        429: { description: "Vượt quá 20 yêu cầu gửi đánh giá trong 10 phút từ cùng một IP" },
      },
    },
  },
  "/api/reception-ratings/configuration": {
    get: {
      tags: ["ReceptionRating"],
      summary: "Lấy cấu hình đánh giá tiếp dân dành cho iPad",
      description:
        "Trả thang điểm, danh sách quầy, giới hạn nhận xét và các gợi ý theo số sao. API không cần đăng nhập.",
      responses: {
        200: {
          description: "Lấy cấu hình đánh giá tiếp dân thành công",
          content: {
            "application/json": {
              schema: successEnvelope({
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
                    properties: { maxLength: { type: "integer", enum: [2000] } },
                  },
                  counters: {
                    type: "array",
                    minItems: 8,
                    maxItems: 8,
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string", enum: counterEnum },
                        name: { type: "string", example: "Quầy 1" },
                      },
                    },
                  },
                  suggestionsByScore: {
                    type: "object",
                    required: ["1", "2", "3", "4", "5"],
                    properties: Object.fromEntries(
                      [1, 2, 3, 4, 5].map((score) => [
                        score,
                        { type: "array", items: { type: "string" } },
                      ])
                    ),
                  },
                },
              }),
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
        "Trả đầy đủ dữ liệu nhập thủ công. Quan hệ đăng ký cũ chỉ còn dùng để truy vết dữ liệu lịch sử.",
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
              schema: successEnvelope({
                type: "object",
                properties: {
                  ...manualRatingProperties,
                  legacyRegistrationId: {
                    type: "string",
                    format: "uuid",
                    nullable: true,
                  },
                  registration: {
                    type: "object",
                    description: "Khối tương thích FE cũ, được dựng từ snapshot",
                    properties: {
                      id: { type: "string", format: "uuid", nullable: true },
                      receptionCode: { type: "string" },
                      receptionDate: { type: "string", format: "date" },
                      timeSlot: { type: "string" },
                      topic: { type: "string" },
                      workingContent: { type: "string" },
                      applicant: {
                        type: "object",
                        properties: {
                          fullName: { type: "string" },
                          phoneNumber: { type: "string", nullable: true },
                          citizenId: { type: "string", nullable: true },
                          address: { type: "string", nullable: true },
                        },
                      },
                      department: { type: "string" },
                      approvalStatus: { type: "string", nullable: true },
                      approver: { type: "object", nullable: true },
                      schedule: { type: "object", nullable: true },
                    },
                  },
                },
              }),
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
        "Thống kê điểm, tỷ lệ hài lòng, kết quả theo quầy và theo tên cán bộ được nhập trên iPad. Yêu cầu quyền RRT_GET_STATS.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "department", in: "query", schema: { type: "string", enum: counterEnum } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        200: {
          description: "Lấy thống kê đánh giá tiếp dân thành công",
          content: {
            "application/json": {
              schema: successEnvelope({
                type: "object",
                properties: {
                  totalRatings: { type: "integer", minimum: 0 },
                  averageScore: { type: "number", minimum: 0, maximum: 5 },
                  satisfactionRate: { type: "number", minimum: 0, maximum: 100 },
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
                  byCounter: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        counterCode: { type: "string" },
                        totalRatings: { type: "integer" },
                        averageScore: { type: "number" },
                      },
                    },
                  },
                  byDepartment: {
                    type: "array",
                    description: "Alias tương thích cho byCounter",
                    items: {
                      type: "object",
                      properties: {
                        department: { type: "string" },
                        totalRatings: { type: "integer" },
                        averageScore: { type: "number" },
                      },
                    },
                  },
                  byOfficer: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        officerName: { type: "string" },
                        totalRatings: { type: "integer" },
                        averageScore: { type: "number" },
                      },
                    },
                  },
                },
              }),
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
  receptionCode: "TD-20260822-001",
  citizenName: "Nguyễn Văn An",
  applicantName: "Nguyễn Văn An",
  officerName: "Trần Thị Bình",
  counterCode: "QUAY_2",
  department: "QUAY_2",
  receptionDate: "2026-08-22",
  timeSlot: "08:30 - 09:30",
  workingContent: "Hướng dẫn thủ tục hành chính",
  topic: "Hướng dẫn thủ tục hành chính",
  score: 5,
  selectedSuggestions: ["Cán bộ rất tận tình và chuyên nghiệp"],
  comment: "Cán bộ hướng dẫn rõ ràng và dễ hiểu.",
  ratedAt: "2026-08-22T09:30:00.000+07:00",
  createdAt: "2026-08-22T09:30:00.000+07:00",
};

applyReceptionDemoExamples(ReceptionRatingSwagger, {
  "GET /api/reception-ratings": {
    parameters: {
      page: 1,
      size: 10,
      search: ratingDemo.receptionCode,
      score: 5,
      department: "QUAY_2",
      fromDate: "2026-08-22",
      toDate: "2026-08-22",
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
      validManualRating: {
        summary: "Demo hợp lệ - nhập thủ công và đánh giá 5 sao",
        value: {
          receptionCode: ratingDemo.receptionCode,
          citizenName: ratingDemo.citizenName,
          officerName: ratingDemo.officerName,
          counterCode: ratingDemo.counterCode,
          receptionDate: ratingDemo.receptionDate,
          timeSlot: ratingDemo.timeSlot,
          workingContent: ratingDemo.workingContent,
          score: ratingDemo.score,
          selectedSuggestions: ratingDemo.selectedSuggestions,
          comment: ratingDemo.comment,
        },
      },
      missingOfficerName: {
        summary: "Demo lỗi 400 - thiếu tên cán bộ",
        value: {
          receptionCode: "TD-20260822-002",
          citizenName: "Nguyễn Văn An",
          counterCode: "QUAY_2",
          receptionDate: "2026-08-22",
          timeSlot: "08:30 - 09:30",
          workingContent: "Hướng dẫn thủ tục hành chính",
          score: 5,
          selectedSuggestions: ["Cán bộ rất tận tình và chuyên nghiệp"],
          comment: "Hài lòng",
        },
      },
    },
    responses: {
      200: successDemo("Gửi đánh giá tiếp dân thành công", ratingDemo),
      400: errorDemo(
        "Demo 400 - Thiếu dữ liệu bắt buộc",
        "Dữ liệu không hợp lệ",
        [{ field: "officerName", message: "Tên cán bộ là bắt buộc" }]
      ),
      409: errorDemo(
        "Demo 409 - Mã tiếp dân bị trùng",
        "Mã tiếp dân đã được đánh giá"
      ),
    },
  },
  "GET /api/reception-ratings/configuration": {
    responses: {
      200: successDemo("Lấy cấu hình đánh giá tiếp dân thành công", {
        scale: { min: 1, max: 5 },
        comment: { maxLength: 2000 },
        counters: counterEnum.map((code, index) => ({
          code,
          name: `Quầy ${index + 1}`,
        })),
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
        ...ratingDemo,
        legacyRegistrationId: null,
        registration: {
          id: null,
          receptionCode: ratingDemo.receptionCode,
          receptionDate: ratingDemo.receptionDate,
          timeSlot: ratingDemo.timeSlot,
          topic: ratingDemo.workingContent,
          workingContent: ratingDemo.workingContent,
          applicant: {
            fullName: ratingDemo.citizenName,
            phoneNumber: null,
            citizenId: null,
            address: null,
          },
          department: ratingDemo.counterCode,
          approvalStatus: null,
          approver: null,
          schedule: null,
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
      department: "QUAY_2",
      fromDate: "2026-08-22",
      toDate: "2026-08-22",
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
        byCounter: [
          { counterCode: "QUAY_2", totalRatings: 4, averageScore: 4.25 },
        ],
        byDepartment: [
          { department: "QUAY_2", totalRatings: 4, averageScore: 4.25 },
        ],
        byOfficer: [
          { officerName: "Trần Thị Bình", totalRatings: 4, averageScore: 4.25 },
        ],
      }),
    },
  },
});

export default ReceptionRatingSwagger;
