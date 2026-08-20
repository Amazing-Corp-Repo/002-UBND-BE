const LeaderMeetingRegistrationSwagger = {
  "/api/leader-meeting-registrations": {
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
