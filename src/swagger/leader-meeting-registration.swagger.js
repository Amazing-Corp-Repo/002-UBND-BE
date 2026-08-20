const LeaderMeetingRegistrationSwagger = {
  "/api/leader-meeting-registrations/lookup": {
    post: {
      tags: ["LeaderMeetingRegistration"],
      summary: "Tra cứu đăng ký gặp lãnh đạo",
      description:
        "Tra cứu bằng đúng một trong hai giá trị: mã đăng ký hoặc số điện thoại. Kết quả che số điện thoại và CCCD, không trả đường dẫn file lưu trữ. Giới hạn 60 yêu cầu/10 phút/IP để chống dò mã.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                registrationCode: { type: "string", example: "LD000123" },
                phoneNumber: { type: "string", example: "0901234567" },
              },
            },
            examples: {
              byCode: {
                summary: "Demo tra cứu bằng mã đăng ký",
                value: { registrationCode: "LD000123" },
              },
              byPhone: {
                summary: "Demo tra cứu bằng số điện thoại",
                value: { phoneNumber: "0901234567" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Tra cứu đăng ký gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Demo thành công - đơn đang chờ duyệt",
                  value: {
                    success: true,
                    message: "Tra cứu đăng ký gặp lãnh đạo thành công",
                    data: [{
                      id: "423e4567-e89b-42d3-a456-426614174001",
                      registrationCode: "LD000123",
                      status: "PENDING",
                      receptionDate: "2099-08-25",
                      timeSlot: "09:00 - 10:30",
                      applicant: {
                        fullName: "Nguyễn Văn Bình",
                        phoneNumber: "******4567",
                        citizenId: "********8901",
                      },
                      leader: {
                        id: "123e4567-e89b-42d3-a456-426614174001",
                        fullName: "Nguyễn Văn An",
                      },
                      ratingStatus: "NOT_RATED",
                    }],
                  },
                },
              },
            },
          },
        },
        400: { description: "Dữ liệu tra cứu không hợp lệ" },
        404: { description: "Không tìm thấy đăng ký gặp lãnh đạo" },
        429: { description: "Vượt quá 60 yêu cầu trong 10 phút trên một IP" },
      },
    },
  },
  "/api/leader-meeting-registrations": {
    get: {
      tags: ["LeaderMeetingRegistration"],
      summary: "Lấy danh sách đăng ký gặp lãnh đạo theo quyền",
      description:
        "Yêu cầu quyền LMR_GET_ALL. Lãnh đạo chỉ xem đơn đăng ký gặp chính mình; ADMIN, APPROVER hoặc PHE_DUYET xem toàn bộ và có thể lọc leaderId. Hỗ trợ search, status, leaderId, fromDate, toDate, page và limit. Phạm vi lãnh đạo luôn được xác định từ access token.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "search", in: "query", schema: { type: "string", example: "LD000123" } },
        { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELED"] } },
        { name: "leaderId", in: "query", schema: { type: "string", format: "uuid", example: "123e4567-e89b-42d3-a456-426614174001" } },
        { name: "fromDate", in: "query", schema: { type: "string", format: "date", example: "2099-08-01" } },
        { name: "toDate", in: "query", schema: { type: "string", format: "date", example: "2099-08-31" } },
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
      ],
      responses: {
        200: {
          description: "Lấy danh sách đăng ký gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Demo danh sách đơn chờ duyệt",
                  value: {
                    success: true,
                    message: "Lấy danh sách đăng ký gặp lãnh đạo thành công",
                    data: [{
                      id: "423e4567-e89b-42d3-a456-426614174001",
                      registrationCode: "LD000123",
                      applicant: {
                        fullName: "Nguyễn Văn Bình",
                        phoneNumber: "0901234567",
                        citizenId: "012345678901",
                      },
                      status: "PENDING",
                      receptionDate: "2099-08-25",
                      timeSlot: "09:00 - 10:30",
                      leader: {
                        id: "123e4567-e89b-42d3-a456-426614174001",
                        fullName: "Nguyễn Văn An",
                      },
                      ratingStatus: "NOT_RATED",
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
        403: { description: "Không có quyền LMR_GET_ALL" },
      },
    },
    post: {
      tags: ["LeaderMeetingRegistration"],
      summary: "Gửi đăng ký gặp lãnh đạo từ Mobile",
      description:
        "Người dân chọn một khung giờ còn chỗ và gửi hồ sơ dạng multipart/form-data. Backend tự xác định lãnh đạo, ngày hẹn, ngày làm đơn, mã đăng ký và trạng thái PENDING. Mỗi số điện thoại hoặc CCCD chỉ được giữ một đăng ký trong cùng ngày hẹn ở các trạng thái PENDING, APPROVED, IN_PROGRESS hoặc COMPLETED. Đơn REJECTED/CANCELED được đăng ký lại ở khung giờ khác; khung giờ cũ không được hoàn chỗ. Giới hạn 30 yêu cầu/10 phút/IP.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: [
                "slotId",
                "fullName",
                "phoneNumber",
                "citizenId",
                "address",
                "reason",
              ],
              properties: {
                slotId: {
                  type: "string",
                  format: "uuid",
                  example: "323e4567-e89b-42d3-a456-426614174001",
                },
                fullName: { type: "string", example: "Nguyễn Văn Bình" },
                phoneNumber: { type: "string", example: "0901234567" },
                citizenId: { type: "string", example: "012345678901" },
                citizenIdIssuedDate: {
                  type: "string",
                  format: "date",
                  example: "2021-05-20",
                },
                citizenIdIssuedPlace: {
                  type: "string",
                  example: "Cục Cảnh sát quản lý hành chính về trật tự xã hội",
                },
                address: { type: "string", example: "Phường Thành Sen, Hà Tĩnh" },
                topic: { type: "string", example: "Kiến nghị về đất đai" },
                reason: {
                  type: "string",
                  example: "Tôi đề nghị được hướng dẫn giải quyết hồ sơ đất đai.",
                },
                citizenIdFront: {
                  type: "string",
                  format: "binary",
                  description: "Ảnh mặt trước CCCD, không bắt buộc, tối đa 5MB",
                },
                citizenIdBack: {
                  type: "string",
                  format: "binary",
                  description: "Ảnh mặt sau CCCD, không bắt buộc, tối đa 5MB",
                },
                supportingDocuments: {
                  type: "array",
                  maxItems: 3,
                  items: { type: "string", format: "binary" },
                  description: "Tối đa 3 tài liệu hỗ trợ, mỗi file tối đa 10MB",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Đăng ký gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Demo hợp lệ - tạo đơn chờ duyệt",
                  value: {
                    success: true,
                    message: "Đăng ký gặp lãnh đạo thành công",
                    data: {
                      id: "423e4567-e89b-42d3-a456-426614174001",
                      registrationCode: "LD000123",
                      status: "PENDING",
                      receptionDate: "2099-08-25",
                      timeSlot: "09:00 - 10:30",
                      leaderName: "Nguyễn Văn An",
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Thiếu hoặc sai dữ liệu/file đính kèm" },
        404: { description: "Khung giờ không tồn tại hoặc đã ngừng hoạt động" },
        409: {
          description:
            "Khung giờ đã qua/đầy hoặc số điện thoại/CCCD đã có đơn giữ chỗ trong ngày hẹn",
        },
        429: { description: "Vượt quá 30 yêu cầu trong 10 phút trên một IP" },
        503: { description: "Xung đột đồng thời, vui lòng thử lại" },
      },
    },
  },
};

export default LeaderMeetingRegistrationSwagger;
