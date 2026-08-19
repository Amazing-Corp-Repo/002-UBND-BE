const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

const PARAMETER_TEST_VALUES = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  scheduleId: "123e4567-e89b-42d3-a456-426614174000",
  slotId: "223e4567-e89b-42d3-a456-426614174000",
  receptionCode: "A00123",
  fromDate: "2099-08-25",
  toDate: "2099-08-31",
  receptionDate: "2099-08-25",
  date: "2099-08-25",
  weekYear: "35/2099",
  monthYear: "8/2099",
  isActive: true,
  page: 1,
  size: 10,
  search: "Nguyễn Văn An",
  score: 5,
  department: "QUAY_3",
  approvalStatus: "PENDING",
  ratingStatus: "NOT_RATED",
};

const PARAMETER_NOTES = {
  id: "Giá trị trên chỉ là UUID mẫu; khi chạy thử cần thay bằng ID bản ghi thật trong database.",
  scheduleId: "Khi chạy thử cần thay bằng ID lịch thật lấy từ API danh sách lịch tiếp dân.",
  slotId: "Khi chạy thử cần thay bằng slotId thật thuộc đúng lịch đã chọn.",
  receptionCode: "Khi chạy thử cần thay bằng mã tiếp dân thật; luồng đánh giá yêu cầu đơn đã COMPLETED.",
};

const DEFAULT_ERROR_EXAMPLES = {
  400: {
    summary: "Demo 400 - Dữ liệu không hợp lệ",
    value: {
      success: false,
      message: "Dữ liệu không hợp lệ",
      errors: [{ field: "fieldName", message: "Giá trị không hợp lệ" }],
    },
  },
  401: {
    summary: "Demo 401 - Chưa đăng nhập",
    value: {
      success: false,
      message: "Acceess token không được cung cấp",
      errors: null,
    },
  },
  403: {
    summary: "Demo 403 - Không đủ quyền",
    value: {
      success: false,
      message: "Bạn không có quyền truy cập tài nguyên này",
      errors: null,
    },
  },
  404: {
    summary: "Demo 404 - Không tìm thấy dữ liệu",
    value: {
      success: false,
      message: "Không tìm thấy dữ liệu",
      errors: null,
    },
  },
  409: {
    summary: "Demo 409 - Xung đột nghiệp vụ",
    value: {
      success: false,
      message: "Dữ liệu xung đột với trạng thái hiện tại",
      errors: null,
    },
  },
  429: {
    summary: "Demo 429 - Vượt giới hạn yêu cầu",
    value: {
      success: false,
      message: "Quá nhiều yêu cầu, vui lòng thử lại sau",
      errors: null,
    },
  },
  500: {
    summary: "Demo 500 - Lỗi máy chủ",
    value: {
      success: false,
      message: "Lỗi máy chủ nội bộ",
      errors: null,
    },
  },
  503: {
    summary: "Demo 503 - Tạm thời không thể xử lý",
    value: {
      success: false,
      message: "Hệ thống đang bận, vui lòng thử lại",
      errors: null,
    },
  },
};

const asNamedExamples = (examples, fallbackName) => {
  if (!examples) return null;
  if ("value" in examples) return { [fallbackName]: examples };
  return examples;
};

/**
 * Gắn các mẫu request/response có thể chọn trực tiếp trong Swagger UI.
 * Hàm chỉ bổ sung tài liệu OpenAPI, không thay đổi route hoặc contract runtime.
 */
export const applyReceptionDemoExamples = (swagger, demos = {}) => {
  for (const [path, pathItem] of Object.entries(swagger)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      const demo = demos[`${method.toUpperCase()} ${path}`] || {};
      for (const parameter of operation.parameters || []) {
        if (!(parameter.name in PARAMETER_TEST_VALUES)) continue;
        parameter.example = PARAMETER_TEST_VALUES[parameter.name];
        if (PARAMETER_NOTES[parameter.name]) {
          const note = PARAMETER_NOTES[parameter.name];
          if (!parameter.description?.includes(note)) {
            parameter.description = parameter.description
              ? `${parameter.description} ${note}`
              : note;
          }
        }
      }

      const requestExamples = asNamedExamples(demo.request, "validRequest");
      if (requestExamples && operation.requestBody?.content) {
        const contentType = demo.requestContentType || "application/json";
        const media = operation.requestBody.content[contentType];
        if (media) {
          media.examples = requestExamples;
          delete media.example;
        }
      }

      for (const [status, response] of Object.entries(operation.responses || {})) {
        const configured = asNamedExamples(
          demo.responses?.[status],
          Number(status) >= 200 && Number(status) < 300
            ? "success"
            : `error${status}`
        );
        const existingExample = response.content?.["application/json"]?.example;
        const fallback =
          configured ||
          (existingExample
            ? {
                success: {
                  summary: `Demo ${status} - ${response.description}`,
                  value: existingExample,
                },
              }
            : DEFAULT_ERROR_EXAMPLES[status]
              ? { [`error${status}`]: DEFAULT_ERROR_EXAMPLES[status] }
              : null);

        if (!fallback) continue;
        response.content ||= {};
        response.content["application/json"] ||= {};
        response.content["application/json"].examples = fallback;
        delete response.content["application/json"].example;
      }
    }
  }

  return swagger;
};

export const successDemo = (message, data, pagination = null) => ({
  summary: `Demo thành công - ${message}`,
  value: { success: true, data, message, pagination },
});

export const errorDemo = (summary, message, errors = null) => ({
  summary,
  value: { success: false, message, errors },
});
