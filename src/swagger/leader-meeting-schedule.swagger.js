const LeaderMeetingScheduleSwagger = {
  "/api/leader-meeting-schedules/management/daily-slots/status": {
    patch: {
      tags: ["LeaderMeetingSchedule"],
      summary: "Mở hoặc đóng một ca tiếp công dân 30 phút",
      description:
        "Yêu cầu quyền LMS_UPDATE_STATUS và vai trò LANH_DAO/LEADER. Lãnh đạo được lấy từ access token. API tự tạo hoặc khôi phục lịch của ngày khi mở ca đầu tiên; chỉ chấp nhận 15 ca cố định trong giờ hành chính. Không được thay đổi ca đã qua và không được đóng ca đã có công dân đăng ký giữ chỗ.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["receptionDate", "startTime", "endTime", "isOpen"],
              properties: {
                receptionDate: { type: "string", format: "date", example: "2099-08-29" },
                startTime: { type: "string", example: "08:30" },
                endTime: { type: "string", example: "09:00" },
                isOpen: { type: "boolean", example: true },
              },
            },
            examples: {
              open: {
                summary: "Demo mở ca 08:30 - 09:00",
                value: {
                  receptionDate: "2099-08-29",
                  startTime: "08:30",
                  endTime: "09:00",
                  isOpen: true,
                },
              },
              close: {
                summary: "Demo đóng ca 11:00 - 11:30",
                value: {
                  receptionDate: "2099-08-29",
                  startTime: "11:00",
                  endTime: "11:30",
                  isOpen: false,
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Mở hoặc đóng ca tiếp công dân thành công; trả lại toàn bộ bảng 15 ca" },
        400: { description: "Ngày/giờ không hợp lệ, không thuộc ca chuẩn hoặc ca đã qua" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMS_UPDATE_STATUS hoặc không phải lãnh đạo" },
        409: { description: "Ca cần đóng đã có công dân đăng ký giữ chỗ" },
      },
    },
  },
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
        "Yêu cầu quyền LMS_UPDATE và vai trò LANH_DAO/LEADER. Chỉ đúng lãnh đạo sở hữu lịch được sửa. Vẫn hỗ trợ trường slots cũ; UI lưới ca mới dùng openSlots để đồng bộ các ca 30 phút đang mở. Không được đóng ca đã có đăng ký giữ chỗ. Các khung giờ không còn dùng được xóa mềm; sức chứa khung mới mặc định 1.",
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
              required: ["receptionDate"],
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
                openSlots: {
                  type: "array",
                  minItems: 0,
                  maxItems: 15,
                  description: "Các ca 30 phút cần mở trong lưới 15 ca cố định",
                  items: {
                    type: "object",
                    required: ["startTime", "endTime"],
                    properties: {
                      startTime: { type: "string", example: "13:30" },
                      endTime: { type: "string", example: "14:00" },
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
              dailyGrid: {
                summary: "Demo đồng bộ các ca đang mở theo UI mới",
                value: {
                  receptionDate: "2099-08-26",
                  openSlots: [
                    { startTime: "13:30", endTime: "14:00" },
                    { startTime: "14:00", endTime: "14:30" },
                  ],
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
        "Yêu cầu quyền LMS_GET_ALL và không nhận leaderId từ client. Không truyền date: trả danh sách phân trang như contract cũ. Khi truyền date: chỉ lãnh đạo được lấy bảng đủ 15 ca cố định của chính mình, gồm 8 ca sáng, 7 ca chiều, số ca đang mở và lý do không thể bật/tắt.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        { name: "size", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date", example: "2099-08-01" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date", example: "2099-08-31" } },
        { name: "isActive", in: "query", schema: { type: "boolean", example: true } },
        { name: "search", in: "query", schema: { type: "string", example: "Nguyễn Văn An" } },
        {
          name: "date",
          in: "query",
          description: "Ngày làm việc để lấy bảng đủ 15 ca theo UI mới",
          schema: { type: "string", format: "date", example: "2099-08-29" },
        },
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
                dailyGrid: {
                  summary: "Demo bảng 15 ca theo ngày cho UI mới",
                  value: {
                    success: true,
                    message: "Lấy bảng ca tiếp công dân theo ngày thành công",
                    data: {
                      id: "223e4567-e89b-42d3-a456-426614174001",
                      receptionDate: "2099-08-29",
                      dayOfWeek: "Thứ Bảy",
                      leader: {
                        id: "123e4567-e89b-42d3-a456-426614174001",
                        fullName: "Nguyễn Văn An",
                      },
                      summary: {
                        totalSlots: 15,
                        openSlots: 2,
                        morningOpenSlots: 2,
                        afternoonOpenSlots: 0,
                      },
                      periods: [
                        {
                          code: "MORNING",
                          name: "Buổi sáng",
                          startTime: "07:30",
                          endTime: "11:30",
                          totalSlots: 8,
                          openSlots: 2,
                          slots: [
                            {
                              id: null,
                              startTime: "07:30",
                              endTime: "08:00",
                              durationMinutes: 30,
                              isOpen: false,
                              capacity: 1,
                              heldCount: 0,
                              remainingCapacity: 0,
                              canToggle: true,
                              blockedReason: null,
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
        "Yêu cầu quyền LMS_CREATE và vai trò LANH_DAO/LEADER. Backend lấy leaderId từ access token, không nhận leaderId từ body. Contract cũ tiếp tục nhận slots. UI mới có thể gửi openSlots gồm các ca 30 phút thuộc 15 ca cố định; địa điểm và ghi chú được Backend điền mặc định, sức chứa mặc định 1.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["receptionDate"],
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
                openSlots: {
                  type: "array",
                  minItems: 1,
                  maxItems: 15,
                  description: "Các ca đang mở trong lưới 15 ca cố định",
                  items: {
                    type: "object",
                    required: ["startTime", "endTime"],
                    properties: {
                      startTime: { type: "string", example: "08:30" },
                      endTime: { type: "string", example: "09:00" },
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
              dailyGrid: {
                summary: "Demo UI mới - mở hai ca 30 phút",
                value: {
                  receptionDate: "2099-08-29",
                  openSlots: [
                    { startTime: "08:30", endTime: "09:00" },
                    { startTime: "11:00", endTime: "11:30" },
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
        "Trả về lịch và khung giờ gặp lãnh đạo đang hoạt động trong tối đa 7 ngày, tính từ hôm nay. Khoảng ngày client gửi sẽ được giới hạn trong cửa sổ này. Mỗi khung giờ có sức chứa độc lập, số đơn đã giữ chỗ, số chỗ còn lại và trạng thái AVAILABLE hoặc FULL. Lịch gặp lãnh đạo không gắn với quầy tiếp dân.",
      parameters: [
        {
          name: "fromDate",
          in: "query",
          required: false,
          description: "Ngày bắt đầu, định dạng YYYY-MM-DD; không thể trước hôm nay",
          schema: { type: "string", format: "date", example: "2099-08-25" },
        },
        {
          name: "toDate",
          in: "query",
          required: false,
          description: "Ngày kết thúc, định dạng YYYY-MM-DD; tối đa ngày thứ 7 tính từ hôm nay",
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
