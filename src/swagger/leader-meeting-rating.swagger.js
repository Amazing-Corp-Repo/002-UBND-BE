const LeaderMeetingRatingSwagger = {
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
