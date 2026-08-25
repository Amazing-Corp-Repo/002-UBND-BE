const LeaderMeetingRatingSwagger = {
  "/api/leader-meeting-ratings": {
    get: {
      tags: ["LeaderMeetingRating"],
      summary: "Lấy danh sách đánh giá gặp lãnh đạo theo quyền",
      description:
        "Yêu cầu quyền LMRT_GET_ALL. Lãnh đạo chỉ xem đánh giá của các lịch mình phụ trách; ADMIN, APPROVER hoặc PHE_DUYET xem toàn bộ và có thể lọc leaderId. Hỗ trợ search, score, leaderId, fromDate, toDate, page và limit; phạm vi luôn lấy từ access token.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "search", in: "query", schema: { type: "string", example: "LD000129" } },
        { name: "score", in: "query", schema: { type: "integer", minimum: 1, maximum: 5, example: 5 } },
        { name: "leaderId", in: "query", schema: { type: "string", format: "uuid", example: "123e4567-e89b-42d3-a456-426614174001" } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date", example: "2099-08-01" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date", example: "2099-08-31" } },
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
      ],
      responses: {
        200: {
          description: "Lấy danh sách đánh giá gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Danh sách đánh giá 5 sao",
                  value: {
                    success: true,
                    message: "Lấy danh sách đánh giá gặp lãnh đạo thành công",
                    data: [{
                      id: "723e4567-e89b-42d3-a456-426614174001",
                      registrationCode: "LD000129",
                      applicantName: "Nguyễn Văn Bình",
                      appointmentDate: "2099-08-25",
                      timeSlot: "09:00 - 10:30",
                      leader: { id: "123e4567-e89b-42d3-a456-426614174001", fullName: "Nguyễn Văn An" },
                      score: 5,
                      comment: "Tôi rất hài lòng",
                    }],
                    pagination: { currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 1 },
                  },
                },
              },
            },
          },
        },
        400: { description: "Bộ lọc không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMRT_GET_ALL" },
      },
    },
    post: {
      tags: ["LeaderMeetingRating"],
      summary: "Gửi đánh giá buổi gặp lãnh đạo từ iPad",
      description:
        "API công khai nhận đánh giá 1-5 sao và nhận xét tự nhập theo mã đăng ký. Chỉ đơn COMPLETED được đánh giá, mỗi đơn chỉ một lần và nhận xét tối đa 2000 ký tự. Giới hạn 20 yêu cầu/10 phút/IP; unique DB chống gửi trùng đồng thời.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["registrationCode", "score"],
              properties: {
                registrationCode: { type: "string", example: "LD000130" },
                score: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                comment: { type: "string", maxLength: 2000 },
              },
            },
            examples: {
              valid: {
                summary: "Demo hợp lệ - đánh giá 5 sao",
                value: {
                  registrationCode: "LD000130",
                  score: 5,
                  comment: "Buổi gặp giải quyết đúng nội dung tôi quan tâm.",
                },
              },
              missingData: { summary: "Demo lỗi - thiếu mã và điểm", value: {} },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Gửi đánh giá gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Đánh giá được lưu thành công",
                  value: {
                    success: true,
                    message: "Gửi đánh giá gặp lãnh đạo thành công",
                    data: {
                      id: "723e4567-e89b-42d3-a456-426614174001",
                      registrationCode: "LD000130",
                      score: 5,
                      comment: "Buổi gặp giải quyết đúng nội dung tôi quan tâm.",
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Thiếu hoặc sai dữ liệu đánh giá" },
        404: { description: "Không tìm thấy mã đăng ký gặp lãnh đạo" },
        409: { description: "Buổi gặp chưa COMPLETED hoặc đơn đã được đánh giá" },
        429: { description: "Vượt quá 20 yêu cầu trong 10 phút trên một IP" },
      },
    },
  },
  "/api/leader-meeting-ratings/configuration": {
    get: {
      tags: ["LeaderMeetingRating"],
      summary: "Lấy cấu hình đánh giá gặp lãnh đạo trên iPad",
      description:
        "API công khai trả thang điểm 1-5 sao và giới hạn nhận xét tự nhập 2000 ký tự. Đơn chỉ được gửi đánh giá khi đã ở trạng thái COMPLETED.",
      responses: {
        200: {
          description: "Lấy cấu hình đánh giá gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Cấu hình dùng trực tiếp trên iPad",
                  value: {
                    success: true,
                    message: "Lấy cấu hình đánh giá gặp lãnh đạo thành công",
                    data: {
                      scale: { min: 1, max: 5 },
                      comment: { maxLength: 2000 },
                      eligibility: { requiredRegistrationStatus: "COMPLETED" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/leader-meeting-ratings/statistics": {
    get: {
      tags: ["LeaderMeetingRating"],
      summary: "Thống kê đánh giá gặp lãnh đạo theo quyền",
      description:
        "Yêu cầu quyền LMRT_GET_STATS. Lãnh đạo chỉ xem thống kê của chính mình; ADMIN, APPROVER hoặc PHE_DUYET xem toàn bộ và có thể lọc leaderId. Trả tổng lượt, điểm trung bình, tỷ lệ hài lòng (4-5 sao), phân bố điểm và tổng hợp theo lãnh đạo.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "leaderId", in: "query", schema: { type: "string", format: "uuid", example: "123e4567-e89b-42d3-a456-426614174001" } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date", example: "2099-08-01" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date", example: "2099-08-31" } },
      ],
      responses: {
        200: {
          description: "Lấy thống kê đánh giá gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Thống kê đánh giá theo lãnh đạo",
                  value: {
                    success: true,
                    message: "Lấy thống kê đánh giá gặp lãnh đạo thành công",
                    data: {
                      totalRatings: 10,
                      averageScore: 4.4,
                      satisfactionRate: 80,
                      scoreDistribution: [
                        { score: 1, count: 0 }, { score: 2, count: 1 },
                        { score: 3, count: 1 }, { score: 4, count: 3 },
                        { score: 5, count: 5 },
                      ],
                      byLeader: [{
                        leader: { id: "123e4567-e89b-42d3-a456-426614174001", fullName: "Nguyễn Văn An" },
                        totalRatings: 10,
                        averageScore: 4.4,
                      }],
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Khoảng ngày hoặc ID lãnh đạo không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMRT_GET_STATS" },
      },
    },
  },
  "/api/leader-meeting-ratings/{id}": {
    get: {
      tags: ["LeaderMeetingRating"],
      summary: "Xem chi tiết đánh giá gặp lãnh đạo",
      description:
        "Yêu cầu quyền LMRT_GET_DETAIL. Lãnh đạo chỉ xem đánh giá thuộc lịch của chính mình; ADMIN, APPROVER hoặc PHE_DUYET xem toàn bộ. Trả đầy đủ nội dung đánh giá, hồ sơ đăng ký, lịch hẹn và lãnh đạo; không chứa dữ liệu quầy.",
      security: [{ bearerAuth: [] }],
      parameters: [{
        name: "id",
        in: "path",
        required: true,
        description: "ID đánh giá gặp lãnh đạo",
        schema: { type: "string", format: "uuid", example: "723e4567-e89b-42d3-a456-426614174001" },
      }],
      responses: {
        200: {
          description: "Lấy chi tiết đánh giá gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Chi tiết đánh giá 5 sao",
                  value: {
                    success: true,
                    message: "Lấy chi tiết đánh giá gặp lãnh đạo thành công",
                    data: {
                      id: "723e4567-e89b-42d3-a456-426614174001",
                      score: 5,
                      comment: "Tôi rất hài lòng",
                      registration: {
                        id: "423e4567-e89b-42d3-a456-426614174007",
                        registrationCode: "LD000129",
                        appointmentDate: "2099-08-25",
                        timeSlot: "09:00 - 10:30",
                        status: "COMPLETED",
                        applicant: {
                          fullName: "Nguyễn Văn Bình",
                          phoneNumber: "0901234567",
                          citizenId: "012345678901",
                          address: "Hà Tĩnh",
                        },
                        location: "Phòng tiếp công dân",
                        leader: {
                          id: "123e4567-e89b-42d3-a456-426614174001",
                          fullName: "Nguyễn Văn An",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "ID đánh giá không đúng định dạng UUID" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMRT_GET_DETAIL" },
        404: { description: "Đánh giá không tồn tại hoặc ngoài phạm vi lãnh đạo" },
      },
    },
  },
};

export default LeaderMeetingRatingSwagger;
