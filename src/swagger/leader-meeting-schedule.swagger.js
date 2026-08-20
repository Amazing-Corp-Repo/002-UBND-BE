const LeaderMeetingScheduleSwagger = {
  "/api/leader-meeting-schedules": {
    get: {
      tags: ["LeaderMeetingSchedule"],
      summary: "Lấy lịch gặp lãnh đạo khả dụng cho Mobile",
      description:
        "Trả về lịch và khung giờ gặp lãnh đạo đang hoạt động trong khoảng ngày yêu cầu. Mỗi khung giờ có sức chứa độc lập, số đơn đã giữ chỗ, số chỗ còn lại và trạng thái AVAILABLE hoặc FULL. Lịch gặp lãnh đạo không gắn với quầy tiếp dân.",
      parameters: [
        {
          name: "fromDate",
          in: "query",
          required: false,
          description: "Ngày bắt đầu, định dạng YYYY-MM-DD",
          schema: { type: "string", format: "date", example: "2099-08-25" },
        },
        {
          name: "toDate",
          in: "query",
          required: false,
          description: "Ngày kết thúc, định dạng YYYY-MM-DD",
          schema: { type: "string", format: "date", example: "2099-08-31" },
        },
        {
          name: "leaderId",
          in: "query",
          required: false,
          description: "Lọc theo ID lãnh đạo",
          schema: {
            type: "string",
            format: "uuid",
            example: "123e4567-e89b-42d3-a456-426614174001",
          },
        },
      ],
      responses: {
        200: {
          description: "Lấy lịch gặp lãnh đạo khả dụng thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Demo thành công - khung giờ còn chỗ",
                  value: {
                    success: true,
                    message: "Lấy lịch gặp lãnh đạo khả dụng thành công",
                    data: [
                      {
                        id: "223e4567-e89b-42d3-a456-426614174001",
                        leader: {
                          id: "123e4567-e89b-42d3-a456-426614174001",
                          fullName: "Nguyễn Văn An",
                        },
                        receptionDate: "2099-08-25",
                        location: "Phòng tiếp công dân",
                        note: "Tiếp công dân định kỳ",
                        slots: [
                          {
                            id: "323e4567-e89b-42d3-a456-426614174001",
                            startTime: "09:00",
                            endTime: "10:30",
                            timeSlot: "09:00 - 10:30",
                            capacity: 1,
                            heldCount: 0,
                            remainingCapacity: 1,
                            status: "AVAILABLE",
                            isFull: false,
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        400: {
          description:
            "Ngày/ID lãnh đạo không hợp lệ hoặc ngày bắt đầu sau ngày kết thúc",
        },
      },
    },
  },
};

export default LeaderMeetingScheduleSwagger;
