import {
  applyReceptionDemoExamples,
  errorDemo,
} from "./reception-demo-example.util.js";

const ReceptionScheduleSwagger = {
  "/api/reception-schedules": {
    get: {
      tags: ["ReceptionSchedule"],
      summary: "Lấy lịch tiếp dân đang hoạt động dành cho Mobile",
      description:
        "Trả lịch tiếp dân công khai trong cửa sổ động 7 ngày theo giờ Việt Nam, gồm ngày hiện tại và 6 ngày tiếp theo. Người dân chỉ xem ngày và khoảng thời gian chung của buổi tiếp dân để đến trực tiếp; API không trả ca 1 giờ, slot, sức chứa hoặc tình trạng giữ chỗ. fromDate/toDate chỉ có thể lọc hẹp hơn bên trong cửa sổ này, không thể mở rộng quá 7 ngày.",
      parameters: [
        {
          name: "fromDate",
          in: "query",
          required: false,
          description: "Ngày bắt đầu lọc; backend không cho nhỏ hơn ngày hiện tại theo giờ Việt Nam",
          schema: { type: "string", format: "date" },
        },
        {
          name: "toDate",
          in: "query",
          required: false,
          description: "Ngày kết thúc lọc; backend không cho vượt quá ngày thứ 7 của cửa sổ hiển thị",
          schema: { type: "string", format: "date" },
        },
      ],
      responses: {
        200: {
          description: "Lấy danh sách ngày và thời gian tiếp dân thành công",
          content: {
            "application/json": {
              example: {
                success: true,
                data: [{
                  id: "123e4567-e89b-12d3-a456-426614174000",
                  receptionDate: "2026-08-26",
                  timeRange: "07:30 - 11:30, 13:30 - 16:30",
                }],
              },
            },
          },
        },
        400: {
          description:
            "Ngày không đúng định dạng YYYY-MM-DD, ngày không tồn tại hoặc ngày bắt đầu sau ngày kết thúc",
        },
      },
    },
  },
};

applyReceptionDemoExamples(ReceptionScheduleSwagger, {
  "GET /api/reception-schedules": {
    parameters: { fromDate: null, toDate: null },
    responses: {
      400: errorDemo(
        "Demo 400 - Khoảng ngày không hợp lệ",
        "Ngày bắt đầu không được sau ngày kết thúc"
      ),
    },
  },
});

export default ReceptionScheduleSwagger;
