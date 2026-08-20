const LeaderMeetingScheduleSwagger = {
  "/api/leader-meeting-schedules/management": {
    get: {
      tags: ["LeaderMeetingSchedule"],
      summary: "Lấy danh sách lịch gặp lãnh đạo theo quyền",
      description:
        "Yêu cầu quyền LMS_GET_ALL. Lãnh đạo chỉ xem lịch của chính mình theo userId trong access token; ADMIN, APPROVER hoặc PHE_DUYET được xem toàn bộ. Backend không nhận leaderId từ client. Hỗ trợ phân trang, khoảng ngày, trạng thái hoạt động và tìm tên lãnh đạo.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        { name: "size", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date", example: "2099-08-01" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date", example: "2099-08-31" } },
        { name: "isActive", in: "query", schema: { type: "boolean", example: true } },
        { name: "search", in: "query", schema: { type: "string", example: "Nguyễn Văn An" } },
      ],
      responses: {
        200: {
          description: "Lấy danh sách lịch gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Demo lãnh đạo xem lịch của mình",
                  value: {
                    success: true,
                    message: "Lấy danh sách lịch gặp lãnh đạo thành công",
                    data: [{
                      id: "223e4567-e89b-42d3-a456-426614174001",
                      leader: {
                        id: "123e4567-e89b-42d3-a456-426614174001",
                        fullName: "Nguyễn Văn An",
                      },
                      receptionDate: "2099-08-25",
                      location: "Phòng tiếp công dân",
                      isActive: true,
                      slotCount: 1,
                      totalCapacity: 1,
                      registrationCount: 1,
                      statusSummary: { PENDING: 1 },
                    }],
                    pagination: {
                      currentPage: 1,
                      pageSize: 10,
                      totalPages: 1,
                      totalItems: 1,
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Bộ lọc không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMS_GET_ALL" },
      },
    },
  },
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
