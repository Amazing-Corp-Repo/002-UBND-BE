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

export default ReceptionRatingSwagger;
