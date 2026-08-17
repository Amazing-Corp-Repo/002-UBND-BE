const ReceptionScheduleSwagger = {
  "/api/reception-schedules": {
    get: {
      tags: ["ReceptionSchedule"],
      summary: "Lấy lịch tiếp dân đang hoạt động dành cho Mobile",
      description:
        "Trả về các lịch tiếp dân đang hoạt động và chưa bị xóa, mặc định tính từ ngày hiện tại. Mỗi lịch có các khung giờ một tiếng để Mobile hiển thị và cho người dân lựa chọn.",
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
        200: { description: "Lấy danh sách lịch tiếp dân thành công" },
        400: { description: "Khoảng ngày không hợp lệ" },
      },
    },
  },
};

export default ReceptionScheduleSwagger;
