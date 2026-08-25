import {
  applyReceptionDemoExamples,
  errorDemo,
  successDemo,
} from "./reception-demo-example.util.js";
import { RECEPTION_SWAGGER_DEMO as DEMO } from "./reception-swagger-demo.fixture.js";

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
  "/api/reception-schedules/{scheduleId}/slots/{slotId}/capacity": {
    patch: {
      tags: ["ReceptionSchedule"],
      summary: "Cập nhật sức chứa của một quầy trong ca tiếp dân",
      description:
        "Cán bộ có quyền LTD_UPDATE được đặt sức chứa là số nguyên từ 1 trở lên và không giới hạn tối đa. Backend đếm đơn theo quan hệ id_cau_hinh_quay, đồng thời hỗ trợ dữ liệu cũ bằng bo_phan. Không được giảm thấp hơn số đơn đã gán vào quầy hoặc làm tổng sức chứa của ca thấp hơn tổng số đơn đã giữ chỗ.",
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
  "PATCH /api/reception-schedules/{scheduleId}/slots/{slotId}/capacity": {
    parameters: {
      scheduleId: DEMO.schedules.capacity,
      slotId: DEMO.slots.capacity,
    },
    request: {
      validCapacity: {
        summary: "Demo hợp lệ - tăng sức chứa quầy lên 3",
        value: { capacity: 3 },
      },
      invalidCapacity: {
        summary: "Demo lỗi 400 - sức chứa nhỏ hơn 1",
        value: { capacity: 0 },
      },
    },
    responses: {
      200: successDemo("Cập nhật sức chứa quầy thành công", {
        counterCode: "QUAY_1",
        capacity: 3,
        heldCount: 1,
        remainingCapacity: 2,
        slotTotalCapacity: 17,
      }),
      409: {
        belowCounterHeldCount: errorDemo(
          "Demo 409 - Thấp hơn số đơn của quầy",
          "Không được giảm sức chứa quầy thấp hơn số đăng ký đã gán"
        ),
        belowSlotHeldCount: errorDemo(
          "Demo 409 - Thấp hơn tổng số đơn của ca",
          "Không được giảm tổng sức chứa ca thấp hơn số đăng ký đã giữ chỗ"
        ),
      },
    },
  },
});

export default ReceptionScheduleSwagger;
