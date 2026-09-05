import PhanAnhSchemas from "../schemas/phan-anh.schema.js";

const bearerSecurity = [{ bearerAuth: [] }];

const idParameter = {
  name: "idPhanAnh",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  description: "ID phản ánh",
};

const standardErrors = {
  400: { description: "Dữ liệu hoặc luồng trạng thái không hợp lệ" },
  401: { description: "Chưa xác thực hoặc token không hợp lệ" },
  403: { description: "Không có quyền thực hiện thao tác" },
};

const complaintResponseProperties = {
  id: { type: "string", format: "uuid" },
  ma_phan_anh: { type: "string", example: "ABCD1234" },
  tieu_de: { type: "string" },
  mo_ta: { type: "string" },
  muc_do: {
    type: "string",
    enum: ["Thông thường", "Khẩn cấp"],
  },
  khu_pho: { type: "string", description: "Nội dung nhập tự do" },
  vi_tri: { type: "string" },
  trang_thai: {
    type: "string",
    enum: ["Đã gửi", "Đang xử lý", "Từ chối", "Đã giải quyết", "Đóng"],
  },
  thoi_gian_tiep_nhan: {
    type: "string",
    format: "date-time",
    nullable: true,
  },
  ngay_du_kien_hoan_thanh: {
    type: "string",
    format: "date-time",
    nullable: true,
  },
  to_phu_trach: { type: "object", nullable: true },
  lich_su_trang_thai: { type: "array", items: { type: "object" } },
  dinh_kem_phan_anh: { type: "array", items: { type: "object" } },
  danh_sach_file_phan_anh: { type: "array", items: { type: "object" } },
  danh_sach_file_giai_quyet: {
    type: "array",
    items: { type: "object" },
  },
  videos: { type: "array", items: { type: "object" } },
  videos_giai_quyet: { type: "array", items: { type: "object" } },
  video_giai_quyet: { type: "object", nullable: true },
};

const PhanAnhSwagger = {
  "/api/phan-anh": {
    post: {
      tags: ["PhanAnh"],
      summary: "Tạo phản ánh mới bằng tài khoản quản trị",
      description:
        "Yêu cầu PA_CREATE. Khu phố là chuỗi nhập tự do. Mức độ chỉ gồm Thông thường hoặc Khẩn cấp. Phải có ít nhất một ảnh hoặc video.",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: PhanAnhSchemas.CreatePhanAnhRequest,
          },
        },
      },
      responses: {
        200: { description: "Tạo phản ánh thành công" },
        ...standardErrors,
      },
    },
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy danh sách phản ánh có phân trang, lọc và sắp xếp",
      description:
        "Yêu cầu PA_GET_ALL. Dữ liệu trả về có trạng thái mới nhất, người phụ trách, thời hạn và media đã phân loại.",
      security: bearerSecurity,
      parameters: [
        {
          name: "idLinhVucPhanAnh",
          in: "query",
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "trangThai",
          in: "query",
          schema: {
            type: "string",
            enum: [
              "Đã gửi",
              "Đang xử lý",
              "Từ chối",
              "Đã giải quyết",
              "Đóng",
            ],
          },
        },
        {
          name: "mucDo",
          in: "query",
          schema: {
            type: "string",
            enum: ["Thông thường", "Khẩn cấp"],
          },
        },
        {
          name: "maPhanAnh",
          in: "query",
          schema: { type: "string" },
        },
        {
          name: "page",
          in: "query",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "size",
          in: "query",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
        {
          name: "sortBy",
          in: "query",
          schema: {
            type: "string",
            enum: [
              "thoi_gian_tao",
              "ma_phan_anh",
              "tieu_de",
              "muc_do",
              "trang_thai",
            ],
          },
        },
        {
          name: "sortOrder",
          in: "query",
          schema: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
          },
        },
      ],
      responses: {
        200: {
          description: "Danh sách phản ánh",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: complaintResponseProperties,
                    },
                  },
                },
              },
            },
          },
        },
        ...standardErrors,
      },
    },
  },
  "/api/phan-anh/public/create": {
    post: {
      tags: ["PhanAnh"],
      summary: "Công dân gửi phản ánh không cần đăng nhập",
      description:
        "Khu phố là chuỗi nhập tự do. Mức độ chỉ gồm Thông thường hoặc Khẩn cấp. Phải có ít nhất một ảnh hoặc video.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: PhanAnhSchemas.CreatePhanAnhPublicRequest,
          },
        },
      },
      responses: {
        200: { description: "Tạo phản ánh thành công" },
        400: { description: "Dữ liệu hoặc tệp đính kèm không hợp lệ" },
      },
    },
  },
  "/api/phan-anh/{maPhanAnh}/for-mobile": {
    get: {
      tags: ["PhanAnh"],
      summary: "Tra cứu phản ánh công khai bằng mã",
      description:
        "Không trả số điện thoại, ID người phụ trách, email hoặc ID người cập nhật nội bộ.",
      parameters: [
        {
          name: "maPhanAnh",
          in: "path",
          required: true,
          schema: { type: "string", pattern: "^[A-Z0-9]{8}$" },
        },
      ],
      responses: {
        200: {
          description: "Thông tin và tiến độ phản ánh đã được lọc an toàn",
        },
        400: { description: "Mã phản ánh không hợp lệ hoặc không tồn tại" },
      },
    },
  },
  "/api/phan-anh/{idPhanAnh}/lich-su-trang-thai": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy lịch sử xử lý phản ánh",
      description:
        "Yêu cầu PA_GET_DETAIL. Bao gồm trạng thái, ghi chú, thời gian và người thực hiện.",
      security: bearerSecurity,
      parameters: [idParameter],
      responses: {
        200: { description: "Lịch sử phản ánh theo thời gian giảm dần" },
        ...standardErrors,
      },
    },
  },
  "/api/phan-anh/user/me": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy phản ánh của người dùng hiện tại",
      security: bearerSecurity,
      parameters: [
        {
          name: "sortTime",
          in: "query",
          schema: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
          },
        },
      ],
      responses: {
        200: { description: "Danh sách phản ánh của người dùng" },
      },
    },
  },
  "/api/phan-anh/muc-do": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy hai mức độ phản ánh hiện hành",
      responses: { 200: { description: "Thông thường và Khẩn cấp" } },
    },
  },
  "/api/phan-anh/trang-thai": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy danh mục trạng thái phản ánh",
      responses: {
        200: {
          description:
            "Đã gửi, Đang xử lý, Từ chối, Đã giải quyết và Đóng",
        },
      },
    },
  },
  "/api/phan-anh/tong-quan": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy thống kê tổng quan phản ánh",
      description:
        "Yêu cầu PA_GET_STATS. Không bao gồm SLA hoặc gia hạn. thong_ke_theo_khu_pho gộp khác biệt hoa/thường và khoảng trắng.",
      security: bearerSecurity,
      responses: {
        200: {
          description: "Thống kê theo trạng thái và khu phố",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "object",
                    properties: {
                      tong_hom_nay: { type: "integer" },
                      thong_ke_theo_trang_thai: { type: "object" },
                      thong_ke_theo_khu_pho: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            khu_pho: { type: "string" },
                            count: { type: "integer" },
                          },
                        },
                      },
                      nhat_ky_hoat_dong: {
                        type: "array",
                        items: { type: "object" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ...standardErrors,
      },
    },
  },
  "/api/phan-anh/muc-do-trang-thai-linh-vuc": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy mức độ, trạng thái và lĩnh vực phản ánh",
      responses: { 200: { description: "Các danh mục đang áp dụng" } },
    },
  },
  "/api/phan-anh/search-by-tieu-de": {
    get: {
      tags: ["PhanAnh"],
      summary: "Tìm phản ánh theo tiêu đề hoặc mã",
      description: "Yêu cầu PA_GET_ALL.",
      security: bearerSecurity,
      parameters: [
        {
          name: "search",
          in: "query",
          required: true,
          schema: { type: "string", minLength: 3, maxLength: 255 },
        },
      ],
      responses: {
        200: { description: "Kết quả tìm kiếm" },
        ...standardErrors,
      },
    },
  },
  "/api/phan-anh/{idPhanAnh}": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy chi tiết phản ánh",
      description:
        "Yêu cầu PA_GET_DETAIL. Trả đầy đủ lịch sử, người phụ trách, hạn xử lý và media phản ánh/giải quyết.",
      security: bearerSecurity,
      parameters: [idParameter],
      responses: {
        200: {
          description: "Chi tiết phản ánh",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  data: {
                    type: "object",
                    properties: complaintResponseProperties,
                  },
                },
              },
            },
          },
        },
        ...standardErrors,
      },
    },
  },
  "/api/phan-anh/update-status/{idPhanAnh}": {
    put: {
      tags: ["PhanAnh"],
      summary: "Duyệt, từ chối hoặc cập nhật trạng thái phản ánh",
      description:
        "Đã gửi → Đang xử lý yêu cầu PA_APPROVE + PA_ASSIGN, idNguoiXuLy và soNgayXuLy 1–90 với mức Thông thường. Khẩn cấp luôn được BE tính hạn đúng 24 giờ từ lúc tiếp nhận. Thông thường được tính theo ngày làm việc từ lúc tiếp nhận. Từ chối yêu cầu PA_REJECT và ghiChu. Giải quyết/Đóng yêu cầu PA_UPDATE_STATUS. Client không gửi ngày hoàn thành tuyệt đối.",
      security: bearerSecurity,
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: PhanAnhSchemas.UpdatePhanAnhStatusRequest,
          },
        },
      },
      responses: {
        200: { description: "Phản ánh sau khi cập nhật" },
        ...standardErrors,
      },
    },
  },
  "/api/phan-anh/update-linh-vuc/{idPhanAnh}": {
    put: {
      tags: ["PhanAnh"],
      summary: "Chuyển lĩnh vực phản ánh",
      description: "Yêu cầu PA_UPDATE_LINH_VUC và ghi nhận lịch sử.",
      security: bearerSecurity,
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: PhanAnhSchemas.UpdatePhanAnhLinhVucRequest,
          },
        },
      },
      responses: {
        200: { description: "Đã chuyển lĩnh vực" },
        ...standardErrors,
      },
    },
  },
  "/api/phan-anh/{idPhanAnh}/nguoi-xu-ly": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy chuyên viên có thể phân công",
      description:
        "Yêu cầu PA_ASSIGN. Chỉ trả người dùng đang hoạt động, chưa bị xóa và quản lý lĩnh vực của phản ánh.",
      security: bearerSecurity,
      parameters: [idParameter],
      responses: {
        200: { description: "Danh sách chuyên viên hợp lệ" },
        ...standardErrors,
      },
    },
  },
  "/api/phan-anh/assign/{idPhanAnh}": {
    put: {
      tags: ["PhanAnh"],
      summary: "Chuyển người phụ trách phản ánh",
      description:
        "Yêu cầu PA_ASSIGN. Người mới phải đang hoạt động và quản lý lĩnh vực của phản ánh. Thao tác được ghi lịch sử.",
      security: bearerSecurity,
      parameters: [idParameter],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: PhanAnhSchemas.AssignPhanAnhRequest,
          },
        },
      },
      responses: {
        200: { description: "Phân công thành công" },
        ...standardErrors,
      },
    },
  },
};

export default PhanAnhSwagger;
