const LeaderMeetingScheduleSwagger = {
  "/api/leader-meeting-schedules/management/{id}/status": {
    put: {
      tags: ["LeaderMeetingSchedule"],
      summary: "Bật hoặc tắt lịch gặp lãnh đạo",
      description:
        "Yêu cầu quyền LMS_UPDATE_STATUS và vai trò LANH_DAO/LEADER. Chỉ đúng lãnh đạo sở hữu lịch được thay đổi trạng thái. Không cho bật hoặc tắt lịch đã có bất kỳ đăng ký giữ chỗ.",
      security: [{ bearerAuth: [] }],
      parameters: [{
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          format: "uuid",
          example: "223e4567-e89b-42d3-a456-426614174003",
        },
      }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["isActive"],
              properties: { isActive: { type: "boolean", example: false } },
            },
            examples: {
              disable: { summary: "Demo tắt lịch", value: { isActive: false } },
              enable: { summary: "Demo bật lịch", value: { isActive: true } },
            },
          },
        },
      },
      responses: {
        200: { description: "Cập nhật trạng thái lịch gặp lãnh đạo thành công" },
        400: { description: "ID hoặc trạng thái không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMS_UPDATE_STATUS hoặc không phải chủ lịch" },
        404: { description: "Lịch không tồn tại hoặc không thuộc lãnh đạo" },
        409: { description: "Lịch đã có đăng ký giữ chỗ" },
      },
    },
  },
  "/api/leader-meeting-schedules/management/{id}": {
    get: {
      tags: ["LeaderMeetingSchedule"],
      summary: "Lấy chi tiết lịch gặp lãnh đạo",
      description:
        "Yêu cầu quyền LMS_GET_DETAIL. Lãnh đạo chỉ xem được lịch của chính mình; ADMIN, APPROVER hoặc PHE_DUYET được xem toàn bộ. Lịch không thuộc phạm vi được trả 404. Kết quả gồm các khung giờ, sức chứa và tổng hợp trạng thái đơn, không chứa dữ liệu quầy.",
      security: [{ bearerAuth: [] }],
      parameters: [{
        name: "id",
        in: "path",
        required: true,
        description: "ID lịch gặp lãnh đạo",
        schema: {
          type: "string",
          format: "uuid",
          example: "223e4567-e89b-42d3-a456-426614174001",
        },
      }],
      responses: {
        200: {
          description: "Lấy chi tiết lịch gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Demo lịch có một đơn đang chờ",
                  value: {
                    success: true,
                    message: "Lấy chi tiết lịch gặp lãnh đạo thành công",
                    data: {
                      id: "223e4567-e89b-42d3-a456-426614174001",
                      leader: {
                        id: "123e4567-e89b-42d3-a456-426614174001",
                        fullName: "Nguyễn Văn An",
                      },
                      receptionDate: "2099-08-25",
                      location: "Phòng tiếp công dân",
                      isActive: true,
                      slots: [{
                        id: "323e4567-e89b-42d3-a456-426614174001",
                        startTime: "09:00",
                        endTime: "10:30",
                        capacity: 1,
                        heldCount: 1,
                        remainingCapacity: 0,
                        statusSummary: { PENDING: 1 },
                      }],
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "ID lịch không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMS_GET_DETAIL" },
        404: { description: "Lịch không tồn tại hoặc không thuộc phạm vi" },
      },
    },
    put: {
      tags: ["LeaderMeetingSchedule"],
      summary: "Cập nhật lịch gặp lãnh đạo chưa có đơn",
      description:
        "Yêu cầu quyền LMS_UPDATE và vai trò LANH_DAO/LEADER. Chỉ đúng lãnh đạo sở hữu lịch được sửa. Không cho sửa ngày, địa điểm, ghi chú hoặc khung giờ nếu lịch đã có bất kỳ đăng ký giữ chỗ. Các khung giờ không còn dùng được xóa mềm; sức chứa khung mới mặc định 1.",
      security: [{ bearerAuth: [] }],
      parameters: [{
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          format: "uuid",
          example: "223e4567-e89b-42d3-a456-426614174002",
        },
      }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["receptionDate", "slots"],
              properties: {
                receptionDate: { type: "string", format: "date", example: "2099-08-26" },
                location: { type: "string", example: "Phòng họp số 2" },
                note: { type: "string", example: "Điều chỉnh lịch công tác" },
                slots: {
                  type: "array",
                  minItems: 1,
                  maxItems: 20,
                  items: {
                    type: "object",
                    required: ["startTime", "endTime"],
                    properties: {
                      startTime: { type: "string", example: "13:30" },
                      endTime: { type: "string", example: "15:00" },
                    },
                  },
                },
              },
            },
            examples: {
              valid: {
                summary: "Demo hợp lệ - đổi sang lịch buổi chiều",
                value: {
                  receptionDate: "2099-08-26",
                  location: "Phòng họp số 2",
                  note: "Điều chỉnh lịch công tác",
                  slots: [{ startTime: "13:30", endTime: "15:00" }],
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Cập nhật lịch gặp lãnh đạo thành công" },
        400: { description: "ID, ngày hoặc khung giờ không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMS_UPDATE hoặc không phải lãnh đạo" },
        404: { description: "Lịch không tồn tại hoặc không thuộc lãnh đạo" },
        409: { description: "Lịch đã có đơn hoặc trùng lịch khác trong ngày" },
      },
    },
    delete: {
      tags: ["LeaderMeetingSchedule"],
      summary: "Xóa mềm lịch gặp lãnh đạo chưa có đơn",
      description:
        "Yêu cầu quyền LMS_DELETE và vai trò LANH_DAO/LEADER. Chỉ đúng lãnh đạo sở hữu lịch được xóa. Backend xóa mềm lịch và các khung giờ; lịch đã có bất kỳ đăng ký giữ chỗ sẽ bị từ chối.",
      security: [{ bearerAuth: [] }],
      parameters: [{
        name: "id",
        in: "path",
        required: true,
        schema: {
          type: "string",
          format: "uuid",
          example: "223e4567-e89b-42d3-a456-426614174004",
        },
      }],
      responses: {
        200: {
          description: "Xóa lịch gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Demo xóa mềm thành công",
                  value: {
                    success: true,
                    message: "Xóa lịch gặp lãnh đạo thành công",
                    data: {
                      id: "223e4567-e89b-42d3-a456-426614174004",
                      deleted: true,
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "ID lịch không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMS_DELETE hoặc không phải chủ lịch" },
        404: { description: "Lịch không tồn tại hoặc không thuộc lãnh đạo" },
        409: { description: "Lịch đã có đăng ký giữ chỗ" },
      },
    },
  },
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
    post: {
      tags: ["LeaderMeetingSchedule"],
      summary: "Lãnh đạo tự tạo lịch gặp công dân",
      description:
        "Yêu cầu quyền LMS_CREATE và vai trò LANH_DAO/LEADER. Backend lấy leaderId từ access token, không nhận leaderId từ body. Mỗi lãnh đạo chỉ có một lịch trong một ngày; lịch phải có 1-20 khung giờ không chồng lấn. Khung giờ có thể là 90 phút mặc định hoặc thời lượng tùy chọn và luôn có sức chứa mặc định 1.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["receptionDate", "slots"],
              properties: {
                receptionDate: { type: "string", format: "date", example: "2099-08-29" },
                location: { type: "string", example: "Phòng tiếp công dân" },
                note: { type: "string", example: "Tiếp công dân định kỳ" },
                slots: {
                  type: "array",
                  minItems: 1,
                  maxItems: 20,
                  items: {
                    type: "object",
                    required: ["startTime", "endTime"],
                    properties: {
                      startTime: { type: "string", example: "09:00" },
                      endTime: { type: "string", example: "10:30" },
                    },
                  },
                },
              },
            },
            examples: {
              valid: {
                summary: "Demo hợp lệ - hai khung 90 phút",
                value: {
                  receptionDate: "2099-08-29",
                  location: "Phòng tiếp công dân",
                  note: "Tiếp công dân định kỳ",
                  slots: [
                    { startTime: "08:00", endTime: "09:30" },
                    { startTime: "09:30", endTime: "11:00" },
                  ],
                },
              },
              overlap: {
                summary: "Demo lỗi 400 - khung giờ chồng lấn",
                value: {
                  receptionDate: "2099-08-25",
                  slots: [
                    { startTime: "08:00", endTime: "09:30" },
                    { startTime: "09:00", endTime: "10:30" },
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Tạo lịch gặp lãnh đạo thành công" },
        400: { description: "Ngày hoặc khung giờ không hợp lệ/chồng lấn" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMS_CREATE hoặc không phải lãnh đạo" },
        409: { description: "Lãnh đạo đã có lịch trong ngày này" },
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
