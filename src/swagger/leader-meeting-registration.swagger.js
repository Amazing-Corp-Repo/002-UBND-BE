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
  "/api/leader-meeting-registrations/{id}": {
    get: {
      tags: ["LeaderMeetingRegistration"],
      summary: "Xem chi tiết đăng ký gặp lãnh đạo",
      description:
        "Yêu cầu quyền LMR_GET_DETAIL. Lãnh đạo chỉ xem hồ sơ đăng ký gặp chính mình; ADMIN, APPROVER hoặc PHE_DUYET được xem toàn bộ. Kết quả có hồ sơ người dân, lịch hẹn, tiến trình xử lý, đánh giá và metadata file nhưng không trả đường dẫn lưu trữ vật lý. Module này không chứa dữ liệu quầy.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "ID đăng ký gặp lãnh đạo",
          schema: {
            type: "string",
            format: "uuid",
            example: "423e4567-e89b-42d3-a456-426614174001",
          },
        },
      ],
      responses: {
        200: {
          description: "Lấy chi tiết đăng ký gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Demo hồ sơ đầy đủ đang chờ duyệt",
                  value: {
                    success: true,
                    message: "Lấy chi tiết đăng ký gặp lãnh đạo thành công",
                    data: {
                      id: "423e4567-e89b-42d3-a456-426614174001",
                      registrationCode: "LD000123",
                      status: "PENDING",
                      applicationDate: "2099-08-20",
                      appointment: {
                        date: "2099-08-25",
                        slotId: "323e4567-e89b-42d3-a456-426614174001",
                        startTime: "09:00",
                        endTime: "10:30",
                        location: "Phòng tiếp công dân",
                        leader: {
                          id: "123e4567-e89b-42d3-a456-426614174001",
                          fullName: "Nguyễn Văn An",
                        },
                      },
                      applicant: {
                        fullName: "Nguyễn Văn Bình",
                        phoneNumber: "0901234567",
                        citizenId: "012345678901",
                        address: "Phường Thành Sen, Hà Tĩnh",
                      },
                      topic: "Kiến nghị về đất đai",
                      reason: "Đề nghị hướng dẫn giải quyết hồ sơ.",
                      workflow: {
                        approver: null,
                        processor: null,
                        completer: null,
                        rejecter: null,
                        canceler: null,
                      },
                      attachments: [
                        {
                          id: "623e4567-e89b-42d3-a456-426614174001",
                          type: "SUPPORTING_DOCUMENT",
                          originalName: "ho-so.pdf",
                          mimeType: "application/pdf",
                          size: 245760,
                          contentEndpoint: "/api/leader-meeting-registrations/423e4567-e89b-42d3-a456-426614174001/attachments/623e4567-e89b-42d3-a456-426614174001",
                          canDownload: true,
                        },
                      ],
                      rating: null,
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "ID đăng ký không đúng định dạng UUID" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMR_GET_DETAIL" },
        404: {
          description:
            "Đăng ký không tồn tại hoặc không thuộc phạm vi lãnh đạo đang đăng nhập",
        },
      },
    },
  },
  "/api/leader-meeting-registrations/{id}/approve": {
    patch: {
      tags: ["LeaderMeetingRegistration"],
      summary: "Phê duyệt đăng ký gặp lãnh đạo",
      description:
        "Yêu cầu quyền LMR_APPROVE. Chỉ đúng lãnh đạo của lịch hẹn được chuyển đơn từ PENDING sang APPROVED. Backend lấy lãnh đạo và người duyệt từ access token, không nhận thông tin quầy và chống hai yêu cầu xử lý đồng thời.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "ID đăng ký đang ở trạng thái PENDING",
          schema: {
            type: "string",
            format: "uuid",
            example: "423e4567-e89b-42d3-a456-426614174001",
          },
        },
      ],
      responses: {
        200: {
          description: "Phê duyệt đăng ký gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Demo hợp lệ - chuyển sang APPROVED",
                  value: {
                    success: true,
                    message: "Phê duyệt đăng ký gặp lãnh đạo thành công",
                    data: {
                      id: "423e4567-e89b-42d3-a456-426614174001",
                      registrationCode: "LD000123",
                      status: "APPROVED",
                      appointment: {
                        date: "2099-08-25",
                        startTime: "09:00",
                        endTime: "10:30",
                        location: "Phòng tiếp công dân",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "ID đăng ký không đúng định dạng UUID" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMR_APPROVE" },
        404: {
          description:
            "Đăng ký không tồn tại hoặc không thuộc lãnh đạo đang đăng nhập",
        },
        409: {
          description:
            "Đơn không còn ở trạng thái PENDING hoặc đã được yêu cầu khác xử lý",
        },
      },
    },
  },
  "/api/leader-meeting-registrations/{id}/reject": {
    patch: {
      tags: ["LeaderMeetingRegistration"],
      summary: "Từ chối đăng ký gặp lãnh đạo",
      description:
        "Yêu cầu quyền LMR_REJECT. Chỉ đúng lãnh đạo của lịch hẹn được chuyển đơn từ PENDING sang REJECTED và phải nhập lý do. Đơn bị từ chối cho phép người dân đăng ký lại ngày hẹn đó ở khung giờ khác, nhưng chỗ của khung giờ cũ không được hoàn lại.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "ID đăng ký đang ở trạng thái PENDING",
          schema: {
            type: "string",
            format: "uuid",
            example: "423e4567-e89b-42d3-a456-426614174002",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["reason"],
              properties: {
                reason: { type: "string", minLength: 5, maxLength: 2000 },
              },
            },
            examples: {
              valid: {
                summary: "Demo hợp lệ - từ chối có lý do",
                value: { reason: "Nội dung không thuộc thẩm quyền giải quyết" },
              },
              missingReason: {
                summary: "Demo lỗi - thiếu lý do",
                value: {},
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Từ chối đăng ký gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Đơn đã chuyển sang REJECTED",
                  value: {
                    success: true,
                    message: "Từ chối đăng ký gặp lãnh đạo thành công",
                    data: {
                      id: "423e4567-e89b-42d3-a456-426614174002",
                      registrationCode: "LD000124",
                      status: "REJECTED",
                      workflow: {
                        rejectionReason: "Nội dung không thuộc thẩm quyền giải quyết",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "ID không hợp lệ hoặc thiếu/sai lý do từ chối" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMR_REJECT" },
        404: {
          description:
            "Đăng ký không tồn tại hoặc không thuộc lãnh đạo đang đăng nhập",
        },
        409: {
          description:
            "Đơn không còn ở trạng thái PENDING hoặc đã được yêu cầu khác xử lý",
        },
      },
    },
  },
  "/api/leader-meeting-registrations/{id}/process": {
    patch: {
      tags: ["LeaderMeetingRegistration"],
      summary: "Bắt đầu xử lý đăng ký gặp lãnh đạo",
      description:
        "Yêu cầu quyền LMR_PROCESS. Chỉ đúng lãnh đạo của lịch hẹn được chuyển đơn từ APPROVED sang IN_PROGRESS. Backend tự ghi người và thời điểm bắt đầu xử lý; ghi chú là tùy chọn. API không sử dụng thông tin quầy.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "ID đăng ký đang ở trạng thái APPROVED",
          schema: {
            type: "string",
            format: "uuid",
            example: "423e4567-e89b-42d3-a456-426614174003",
          },
        },
      ],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                note: { type: "string", maxLength: 2000, nullable: true },
              },
            },
            examples: {
              withNote: {
                summary: "Demo bắt đầu xử lý có ghi chú",
                value: {
                  note: "Buổi gặp đã diễn ra, vụ việc đang được tiếp tục xử lý",
                },
              },
              withoutNote: {
                summary: "Demo bắt đầu xử lý không ghi chú",
                value: {},
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Bắt đầu xử lý đăng ký gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Đơn đã chuyển sang IN_PROGRESS",
                  value: {
                    success: true,
                    message: "Bắt đầu xử lý đăng ký gặp lãnh đạo thành công",
                    data: {
                      id: "423e4567-e89b-42d3-a456-426614174003",
                      registrationCode: "LD000125",
                      status: "IN_PROGRESS",
                      workflow: {
                        processingNote:
                          "Buổi gặp đã diễn ra, vụ việc đang được tiếp tục xử lý",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "ID không hợp lệ hoặc ghi chú quá 2000 ký tự" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMR_PROCESS" },
        404: {
          description:
            "Đăng ký không tồn tại hoặc không thuộc lãnh đạo đang đăng nhập",
        },
        409: {
          description:
            "Đơn không ở trạng thái APPROVED hoặc đã được yêu cầu khác xử lý",
        },
      },
    },
  },
  "/api/leader-meeting-registrations/{id}/complete": {
    patch: {
      tags: ["LeaderMeetingRegistration"],
      summary: "Hoàn thành đăng ký gặp lãnh đạo",
      description:
        "Yêu cầu quyền LMR_COMPLETE. Chỉ đúng lãnh đạo của lịch hẹn được chuyển đơn từ IN_PROGRESS sang COMPLETED. Backend tự ghi người và thời điểm hoàn thành. Chỉ sau bước này đơn mới đủ điều kiện đánh giá trên iPad.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "ID đăng ký đang ở trạng thái IN_PROGRESS",
          schema: {
            type: "string",
            format: "uuid",
            example: "423e4567-e89b-42d3-a456-426614174004",
          },
        },
      ],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                note: { type: "string", maxLength: 2000, nullable: true },
              },
            },
            examples: {
              valid: {
                summary: "Demo hoàn thành có ghi chú",
                value: { note: "Đã xử lý xong nội dung kiến nghị" },
              },
              withoutNote: {
                summary: "Demo hoàn thành không ghi chú",
                value: {},
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Hoàn thành đăng ký gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Đơn hoàn thành và được phép đánh giá",
                  value: {
                    success: true,
                    message: "Hoàn thành đăng ký gặp lãnh đạo thành công",
                    data: {
                      id: "423e4567-e89b-42d3-a456-426614174004",
                      registrationCode: "LD000126",
                      status: "COMPLETED",
                      ratingEligible: true,
                      workflow: {
                        completionNote: "Đã xử lý xong nội dung kiến nghị",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "ID không hợp lệ hoặc ghi chú quá 2000 ký tự" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMR_COMPLETE" },
        404: {
          description:
            "Đăng ký không tồn tại hoặc không thuộc lãnh đạo đang đăng nhập",
        },
        409: {
          description:
            "Đơn không ở trạng thái IN_PROGRESS hoặc đã được yêu cầu khác xử lý",
        },
      },
    },
  },
  "/api/leader-meeting-registrations/{id}/cancel": {
    patch: {
      tags: ["LeaderMeetingRegistration"],
      summary: "Hủy đăng ký gặp lãnh đạo",
      description:
        "Yêu cầu quyền LMR_CANCEL. Chỉ đúng lãnh đạo của lịch hẹn được chuyển đơn từ APPROVED sang CANCELED; ADMIN và APPROVER không được hủy thay. Lý do là bắt buộc. Người dân được đăng ký lại ở khung giờ khác nhưng chỗ cũ không được hoàn lại.",
      security: [{ bearerAuth: [] }],
      parameters: [{
        name: "id",
        in: "path",
        required: true,
        description: "ID đăng ký đang ở trạng thái APPROVED",
        schema: { type: "string", format: "uuid", example: "423e4567-e89b-42d3-a456-426614174005" },
      }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["reason"],
              properties: { reason: { type: "string", minLength: 5, maxLength: 2000 } },
            },
            examples: {
              valid: {
                summary: "Demo hủy do lịch công tác đột xuất",
                value: { reason: "Lãnh đạo có lịch công tác đột xuất" },
              },
              missingReason: { summary: "Demo lỗi - thiếu lý do", value: {} },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Hủy đăng ký gặp lãnh đạo thành công",
          content: {
            "application/json": {
              examples: {
                success: {
                  summary: "Đơn đã chuyển sang CANCELED",
                  value: {
                    success: true,
                    message: "Hủy đăng ký gặp lãnh đạo thành công",
                    data: {
                      id: "423e4567-e89b-42d3-a456-426614174005",
                      registrationCode: "LD000127",
                      status: "CANCELED",
                      workflow: { cancellationReason: "Lãnh đạo có lịch công tác đột xuất" },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "ID không hợp lệ hoặc thiếu/sai lý do hủy" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LMR_CANCEL" },
        404: { description: "Đăng ký không tồn tại hoặc không thuộc lãnh đạo đang đăng nhập" },
        409: { description: "Đơn không ở trạng thái APPROVED hoặc đã được yêu cầu khác xử lý" },
      },
    },
  },
};

export default LeaderMeetingRegistrationSwagger;
