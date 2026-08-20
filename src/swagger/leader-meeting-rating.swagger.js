const LeaderMeetingRatingSwagger = {
  "/api/leader-meeting-ratings": {
    post: {
      tags: ["LeaderMeetingRating"],
      summary: "Gửi đánh giá buổi gặp lãnh đạo từ iPad",
      description:
        "API công khai nhận đánh giá 1-5 sao theo mã đăng ký. Chỉ đơn COMPLETED được đánh giá, mỗi đơn chỉ một lần, gợi ý phải thuộc đúng mức sao và nhận xét tối đa 2000 ký tự. Giới hạn 20 yêu cầu/10 phút/IP; unique DB chống gửi trùng đồng thời.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["registrationCode", "score"],
              properties: {
                registrationCode: { type: "string", example: "LD000126" },
                score: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                selectedSuggestions: {
                  type: "array",
                  maxItems: 5,
                  items: { type: "string" },
                },
                comment: { type: "string", maxLength: 2000 },
              },
            },
            examples: {
              valid: {
                summary: "Demo hợp lệ - đánh giá 5 sao",
                value: {
                  registrationCode: "LD000126",
                  score: 5,
                  selectedSuggestions: [
                    "Lãnh đạo rất tận tình và chuyên nghiệp",
                    "Tôi rất hài lòng với buổi gặp lãnh đạo",
                  ],
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
                      registrationCode: "LD000126",
                      score: 5,
                      selectedSuggestions: ["Lãnh đạo rất tận tình và chuyên nghiệp"],
                      comment: "Buổi gặp giải quyết đúng nội dung tôi quan tâm.",
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Thiếu/sai dữ liệu hoặc gợi ý không thuộc mức sao" },
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
        "API công khai trả thang điểm 1-5 sao, giới hạn nhận xét 2000 ký tự và các gợi ý tích cực tương ứng từng mức sao. Đơn chỉ được gửi đánh giá khi đã ở trạng thái COMPLETED.",
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
                      suggestionsByScore: {
                        1: ["Lãnh đạo đã tiếp nhận ý kiến của tôi"],
                        2: ["Lãnh đạo có lắng nghe ý kiến"],
                        3: ["Lãnh đạo giao tiếp lịch sự"],
                        4: ["Lãnh đạo nhiệt tình và tôn trọng"],
                        5: ["Tôi rất hài lòng với buổi gặp lãnh đạo"],
                      },
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
};

export default LeaderMeetingRatingSwagger;
