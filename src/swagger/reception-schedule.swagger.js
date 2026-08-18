const ReceptionScheduleSwagger = {
  "/api/reception-schedules": {
    get: {
      tags: ["ReceptionSchedule"],
      summary: "Lấy lịch tiếp dân đang hoạt động dành cho Mobile",
      description:
        "Trả về các lịch tiếp dân đang hoạt động và chưa bị xóa, mặc định tính từ ngày hiện tại. Mỗi ca có sức chứa, số chỗ đã giữ, số chỗ còn lại và trạng thái đã đầy. availableSlots được giữ để tương thích API cũ; Mobile nên dùng slots hoặc openSlots để kiểm tra khả năng đăng ký.",
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
                    timeSlot: "07:30 - 08:30",
                    totalCapacity: 16,
                    heldCount: 3,
                    remainingCapacity: 13,
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
};

export default ReceptionScheduleSwagger;
