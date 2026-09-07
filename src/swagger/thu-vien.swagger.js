import ThuVienSchemas from "../schemas/thu-vien.schema.js";

const ThuVienSwagger = {
  // ============ VĂN HÓA - LỊCH SỬ ============

  "/api/tai-lieu-van-hoa/paging": {
    get: {
      tags: ["TaiLieuVanHoa"],
      summary: "Lấy danh sách tài liệu văn hóa (phân trang)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Trang hiện tại" },
        { name: "size", in: "query", schema: { type: "integer", default: 10 }, description: "Số bản ghi mỗi trang" },
        { name: "search", in: "query", schema: { type: "string" }, description: "Tìm kiếm theo tiêu đề, mô tả" },
        { name: "idDanhMuc", in: "query", schema: { type: "string", format: "uuid" }, description: "Lọc theo danh mục" },
        { name: "trangThai", in: "query", schema: { type: "string" }, description: "Lọc theo trạng thái (NHAP, CHO_DUYET, DA_DUYET, LUU_TRU)" },
        { name: "phamVi", in: "query", schema: { type: "string" }, description: "Lọc theo phạm vi (CONG_KHAI, NOI_BO, HAN_CHE)" },
        { name: "aiDaHoc", in: "query", schema: { type: "boolean" }, description: "Lọc theo trạng thái AI đã học" },
        { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Lọc từ ngày ban hành" },
        { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "Lọc đến ngày ban hành" },
        { name: "sortBy", in: "query", schema: { type: "string", default: "thoi_gian_tao" }, description: "Trường sắp xếp" },
        { name: "sortOrder", in: "query", schema: { type: "string", default: "desc" }, description: "Thứ tự sắp xếp (asc, desc)" },
      ],
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa/{id}": {
    get: {
      tags: ["TaiLieuVanHoa"],
      summary: "Lấy chi tiết tài liệu văn hóa",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
    put: {
      tags: ["TaiLieuVanHoa"],
      summary: "Cập nhật tài liệu văn hóa",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      requestBody: {
        content: { "multipart/form-data": { schema: ThuVienSchemas.UpdateVanHoaRequest } },
        required: true,
      },
      responses: {},
    },
    delete: {
      tags: ["TaiLieuVanHoa"],
      summary: "Xóa tài liệu văn hóa",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa": {
    post: {
      tags: ["TaiLieuVanHoa"],
      summary: "Tạo mới tài liệu văn hóa",
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: { "multipart/form-data": { schema: ThuVienSchemas.CreateVanHoaRequest } },
        required: true,
      },
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa/update-status/{id}": {
    put: {
      tags: ["TaiLieuVanHoa"],
      summary: "Cập nhật trạng thái tài liệu văn hóa",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      requestBody: {
        content: { "application/json": { schema: ThuVienSchemas.UpdateStatusTaiLieuRequest } },
        required: true,
      },
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa/ai-learn/{id}": {
    post: {
      tags: ["TaiLieuVanHoa"],
      summary: "Đồng bộ AI cho tài liệu văn hóa",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      requestBody: {
        content: { "application/json": { schema: ThuVienSchemas.AiLearnRequest } },
        required: true,
      },
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa/approve/{id}": {
    put: {
      tags: ["TaiLieuVanHoa"],
      summary: "Phê duyệt tài liệu văn hóa",
      description: "Chuyển trạng thái từ CHO_DUYET sang DA_DUYET. Ghi nhận người duyệt và thời gian duyệt.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa/reject/{id}": {
    put: {
      tags: ["TaiLieuVanHoa"],
      summary: "Từ chối tài liệu văn hóa",
      description: "Chuyển trạng thái từ CHO_DUYET về TU_CHOI. Ghi lý do từ chối (nếu có). Người đăng thấy rõ là bị từ chối và có thể chỉnh sửa → gửi duyệt lại.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      requestBody: {
        content: { "application/json": { schema: ThuVienSchemas.RejectTaiLieuRequest } },
        required: false,
      },
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa/unapprove/{id}": {
    put: {
      tags: ["TaiLieuVanHoa"],
      summary: "Hoàn tác phê duyệt tài liệu văn hóa",
      description: "Chuyển trạng thái từ DA_DUYET về CHO_DUYET. Xóa thông tin người duyệt và thời gian duyệt.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa/statistics": {
    get: {
      tags: ["TaiLieuVanHoa"],
      summary: "Thống kê tài liệu văn hóa",
      security: [{ bearerAuth: [] }],
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa/sub-categories": {
    get: {
      tags: ["TaiLieuVanHoa"],
      summary: "Lấy danh sách tiểu mục văn hóa",
      security: [{ bearerAuth: [] }],
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa/{id}/download": {
    get: {
      tags: ["TaiLieuVanHoa"],
      summary: "Download tài liệu văn hóa",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
  },
  "/api/tai-lieu-van-hoa/{id}/media/{mediaId}": {
    delete: {
      tags: ["TaiLieuVanHoa"],
      summary: "Xóa media đính kèm tài liệu văn hóa",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
        { name: "mediaId", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID media" },
      ],
      responses: {},
    },
  },

  // ============ PHÁP LUẬT ============

  "/api/tai-lieu-phap-luat/paging": {
    get: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Lấy danh sách tài liệu pháp luật (phân trang)",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Trang hiện tại" },
        { name: "size", in: "query", schema: { type: "integer", default: 10 }, description: "Số bản ghi mỗi trang" },
        { name: "search", in: "query", schema: { type: "string" }, description: "Tìm kiếm theo tiêu đề, số hiệu, tóm tắt" },
        { name: "idDanhMuc", in: "query", schema: { type: "string", format: "uuid" }, description: "Lọc theo loại văn bản" },
        { name: "trangThai", in: "query", schema: { type: "string" }, description: "Lọc theo trạng thái" },
        { name: "phamVi", in: "query", schema: { type: "string" }, description: "Lọc theo phạm vi" },
        { name: "aiDaHoc", in: "query", schema: { type: "boolean" }, description: "Lọc theo trạng thái AI" },
        { name: "dateFrom", in: "query", schema: { type: "string", format: "date" }, description: "Lọc từ ngày ban hành" },
        { name: "dateTo", in: "query", schema: { type: "string", format: "date" }, description: "Lọc đến ngày ban hành" },
        { name: "coQuanBanHanh", in: "query", schema: { type: "string" }, description: "Lọc theo cơ quan ban hành" },
        { name: "sortBy", in: "query", schema: { type: "string", default: "thoi_gian_tao" }, description: "Trường sắp xếp" },
        { name: "sortOrder", in: "query", schema: { type: "string", default: "desc" }, description: "Thứ tự sắp xếp" },
      ],
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat/{id}": {
    get: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Lấy chi tiết tài liệu pháp luật",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
    put: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Cập nhật tài liệu pháp luật",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      requestBody: {
        content: { "multipart/form-data": { schema: ThuVienSchemas.UpdatePhapLuatRequest } },
        required: true,
      },
      responses: {},
    },
    delete: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Xóa tài liệu pháp luật",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat": {
    post: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Tạo mới tài liệu pháp luật",
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: { "multipart/form-data": { schema: ThuVienSchemas.CreatePhapLuatRequest } },
        required: true,
      },
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat/update-status/{id}": {
    put: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Cập nhật trạng thái tài liệu pháp luật",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      requestBody: {
        content: { "application/json": { schema: ThuVienSchemas.UpdateStatusTaiLieuRequest } },
        required: true,
      },
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat/ai-learn/{id}": {
    post: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Đồng bộ AI cho tài liệu pháp luật",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      requestBody: {
        content: { "application/json": { schema: ThuVienSchemas.AiLearnRequest } },
        required: true,
      },
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat/approve/{id}": {
    put: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Phê duyệt tài liệu pháp luật",
      description: "Chuyển trạng thái từ CHO_DUYET sang DA_DUYET. Ghi nhận người duyệt và thời gian duyệt.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat/reject/{id}": {
    put: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Từ chối tài liệu pháp luật",
      description: "Chuyển trạng thái từ CHO_DUYET về TU_CHOI. Ghi lý do từ chối (nếu có). Người đăng thấy rõ là bị từ chối và có thể chỉnh sửa → gửi duyệt lại.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      requestBody: {
        content: { "application/json": { schema: ThuVienSchemas.RejectTaiLieuRequest } },
        required: false,
      },
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat/unapprove/{id}": {
    put: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Hoàn tác phê duyệt tài liệu pháp luật",
      description: "Chuyển trạng thái từ DA_DUYET về CHO_DUYET. Xóa thông tin người duyệt và thời gian duyệt.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat/statistics": {
    get: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Thống kê tài liệu pháp luật",
      security: [{ bearerAuth: [] }],
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat/doc-types": {
    get: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Lấy danh sách loại văn bản pháp luật",
      security: [{ bearerAuth: [] }],
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat/issuing-agencies": {
    get: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Lấy danh sách cơ quan ban hành",
      security: [{ bearerAuth: [] }],
      responses: {},
    },
  },
  "/api/tai-lieu-phap-luat/{id}/download": {
    get: {
      tags: ["TaiLieuPhapLuat"],
      summary: "Download tài liệu pháp luật",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
  },

  // ============ CÔNG KHAI (public, không cần auth) ============

  "/api/tai-lieu-cong-khai/paging": {
    get: {
      tags: ["TaiLieuCongKhai"],
      summary: "Lấy danh sách tài liệu công khai (phân trang)",
      description: "Public endpoint — không cần token. Chỉ trả về tài liệu DA_DUYET + CONG_KHAI.",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 }, description: "Trang hiện tại" },
        { name: "size", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 }, description: "Số bản ghi mỗi trang" },
        { name: "search", in: "query", schema: { type: "string", maxLength: 100 }, description: "Tìm kiếm theo tiêu đề, mô tả, số hiệu" },
        { name: "idDanhMuc", in: "query", schema: { type: "string", format: "uuid" }, description: "Lọc theo danh mục" },
        { name: "loai", in: "query", schema: { type: "string", enum: ["VAN_HOA", "PHAP_LUAT"] }, description: "Lọc loại tài liệu. Bỏ qua để trả về cả hai." },
        { name: "sortBy", in: "query", schema: { type: "string", enum: ["thoi_gian_tao", "tieu_de", "ngay_ban_hanh", "luot_xem", "so_luot_tai"] }, description: "Trường sắp xếp" },
        { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Thứ tự sắp xếp" },
      ],
      responses: {},
    },
  },
  "/api/tai-lieu-cong-khai/{id}": {
    get: {
      tags: ["TaiLieuCongKhai"],
      summary: "Lấy chi tiết tài liệu công khai",
      description: "Public endpoint — không cần token.",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" }, description: "ID tài liệu" },
      ],
      responses: {},
    },
  },
};

export default ThuVienSwagger;
