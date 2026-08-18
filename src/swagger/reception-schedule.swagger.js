const ReceptionScheduleSwagger = {
  "/api/reception-schedules": {
    get: {
      tags: ["ReceptionSchedule"],
      summary: "Lấy lịch tiếp dân đang hoạt động dành cho Mobile",
      description:
        "Trả về các lịch tiếp dân đang hoạt động và chưa bị xóa, mặc định tính từ ngày hiện tại. Mỗi ca có slotId đại diện, giờ bắt đầu, giờ kết thúc, sức chứa, số chỗ đã giữ, số chỗ còn lại và trạng thái AVAILABLE hoặc FULL. availableSlots và openSlots vẫn được giữ nguyên để tương thích API cũ; client mới nên gửi slotId khi đăng ký.",
      parameters: [
        {
          name: "fromDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
        },
        {
          name: "toDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
        },
      ],
      responses: {
        200: {
          description: "Lấy danh sách lịch tiếp dân và tình trạng chỗ thành công",
          content: {
            "application/json": {
              example: {
                success: true,
                data: [{
                  id: "123e4567-e89b-12d3-a456-426614174000",
                  officerName: "Nguyễn Văn An",
                  location: "Bộ phận tiếp công dân",
                  receptionDate: "2026-08-26",
                  availableSlots: ["07:30 - 08:30"],
                  openSlots: ["07:30 - 08:30"],
                  slots: [{
                    slotId: "223e4567-e89b-12d3-a456-426614174000",
                    startTime: "07:30",
                    endTime: "08:30",
                    timeSlot: "07:30 - 08:30",
                    totalCapacity: 16,
                    heldCount: 3,
                    remainingCapacity: 13,
                    status: "AVAILABLE",
                    isFull: false,
                  }],
                }],
              },
            },
          },
        },
        400: { description: "Khoảng ngày không hợp lệ" },
      },
    },
  },
  "/api/reception-schedules/{scheduleId}/slots/{slotId}/capacity": {
    patch: {
      tags: ["ReceptionSchedule"],
      summary: "Cập nhật sức chứa của một quầy trong ca tiếp dân",
      description:
        "Cán bộ có quyền LTD_UPDATE được đặt sức chứa là số nguyên từ 1 trở lên và không giới hạn tối đa. Không được giảm thấp hơn số đơn đã gán vào quầy hoặc làm tổng sức chứa của ca thấp hơn tổng số đơn đã giữ chỗ.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "scheduleId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        { name: "slotId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["capacity"],
              properties: { capacity: { type: "integer", minimum: 1, example: 3 } },
            },
          },
        },
      },
      responses: {
        200: { description: "Cập nhật sức chứa quầy thành công" },
        400: { description: "ID hoặc sức chứa không hợp lệ" },
        401: { description: "Thiếu hoặc sai access token" },
        403: { description: "Không có quyền LTD_UPDATE" },
        404: { description: "Không tìm thấy cấu hình quầy trong lịch" },
        409: { description: "Sức chứa mới thấp hơn số chỗ đã được giữ" },
      },
    },
  },
};

export default ReceptionScheduleSwagger;
