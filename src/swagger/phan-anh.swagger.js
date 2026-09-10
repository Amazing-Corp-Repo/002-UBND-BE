import PhanAnhSchemas from "../schemas/phan-anh.schema.js";

const PhanAnhSwagger = {
  "/api/phan-anh": {
    post: {
      tags: ["PhanAnh"],
      summary: "Tạo phản ánh mới (yêu cầu đăng nhập)",
      description:
        "Tạo phản ánh từ tài khoản có quyền PA_CREATE. Khu phố và ít nhất một ảnh là bắt buộc; mô tả vị trí/mốc nhận diện không bắt buộc. Không nhận kinh độ/vĩ độ. Hỗ trợ tối đa 5 ảnh JPEG/PNG, mỗi ảnh tối đa 3 MB; video là tài liệu tùy chọn.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: PhanAnhSchemas.CreatePhanAnhRequest,
          },
        },
        required: true,
      },
      responses: {
        200: { description: "Tạo phản ánh thành công" },
        400: {
          description:
            "Dữ liệu không hợp lệ, thiếu khu phố, thiếu hình ảnh hoặc lĩnh vực không tồn tại",
        },
        401: { description: "Chưa đăng nhập hoặc token hết hạn" },
        403: { description: "Không có quyền PA_CREATE" },
      },
    },
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy danh sách phản ánh với phân trang và lọc sử dụng trên web",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "idLinhVucPhanAnh",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "Lọc theo ID lĩnh vực phản ánh",
        },
        {
          name: "trangThai",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "Lọc theo mã trạng thái DA_GUI, DANG_XU_LY, DA_GIAI_QUYET, DONG hoặc TU_CHOI; vẫn nhận giá trị tiếng Việt cũ để tương thích",
        },
        {
          name: "mucDo",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "Lọc theo mức độ phản ánh",
        },
        {
          name: "page",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            default: 1,
            minimum: 1,
          },
          description: "Số trang hiện tại",
        },
        {
          name: "size",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            default: 10,
            minimum: 1,
            maximum: 100,
          },
          description: "Số mục trên mỗi trang",
        },
        {
          name: "maPhanAnh",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "Lọc theo mã phản ánh",
        },
        {
          name: "sortTime",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
          },
          description: `Sắp xếp theo thời gian tạo phản ánh:
                        - "desc": mới nhất trước (mặc định)
                        - "asc": cũ nhất trước`,
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/{maPhanAnh}/for-mobile": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy thông tin phản ánh theo mã phản ánh cho mobile",
      parameters: [
        {
          name: "maPhanAnh",
          in: "path",
          required: true,
          schema: {
            type: "string",
            pattern: "^[A-Z0-9]{8}$",
          },
          description: "Mã phản ánh cần lấy thông tin",
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/{idPhanAnh}/lich-su-trang-thai": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy lịch sử trạng thái của phản ánh",
      parameters: [
        {
          name: "idPhanAnh",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID của phản ánh cần lấy lịch sử trạng thái",
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/user/me": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy danh sách phản ánh của người dùng hiện tại",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "sortTime",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["asc", "desc"],
            default: "desc",
          },
      description: `Sắp xếp theo thời gian tạo phản ánh:
                        - "desc": mới nhất trước (mặc định)
                        - "asc": cũ nhất trước`,
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/muc-do": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy mức độ phản ánh",
      responses: {},
    },
  },
  "/api/phan-anh/trang-thai": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy trạng thái phản ánh",
      responses: {},
    },
  },
  "/api/phan-anh/{idPhanAnh}": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy phản ánh theo ID sử dụng trên web",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "idPhanAnh",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID của phản ánh cần lấy thông tin",
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/update-status/{idPhanAnh}": {
    put: {
      tags: ["PhanAnh"],
      summary: "Cập nhật trạng thái phản ánh",
      security: [{ bearerAuth: [] }],
      description: "Cập nhật trạng thái phản ánh theo ID",
      parameters: [
        {
          name: "idPhanAnh",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID phản ánh cần cập nhật trạng thái",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: PhanAnhSchemas.UpdatePhanAnhStatusRequest,
          },
        },
      },
      responses: {},
    },
  },
  "/api/phan-anh/update-linh-vuc/{idPhanAnh}": {
    put: {
      tags: ["PhanAnh"],
      summary: "Cập nhật lĩnh vực phản ánh",
      security: [{ bearerAuth: [] }],
      description:
        "Cập nhật (reassign) lĩnh vực phản ánh sang lĩnh vực khác. Yêu cầu permission PA_UPDATE_LINH_VUC. Không cho phép cập nhật nếu phản ánh đã ở trạng thái DA_GIAI_QUYET hoặc DONG.",
      parameters: [
        {
          name: "idPhanAnh",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "ID phản ánh cần cập nhật lĩnh vực",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: PhanAnhSchemas.UpdatePhanAnhLinhVucRequest,
          },
        },
      },
      responses: {
        200: {
          description: "Cập nhật lĩnh vực phản ánh thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example: "Cập nhật lĩnh vực phản ánh thành công",
                  },
                  pagination: { type: "object", nullable: true, example: null },
                  data: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      ma_phan_anh: { type: "string" },
                      tieu_de: { type: "string" },
                      mo_ta: { type: "string" },
                      vi_tri: { type: "string" },
                      muc_do: { type: "string" },
                      id_linh_vuc_phan_anh: {
                        type: "string",
                        format: "uuid",
                        description: "ID lĩnh vực mới vừa cập nhật",
                      },
                      ten_nguoi_phan_anh: { type: "string" },
                      sdt_nguoi_phan_anh: { type: "string" },
                      nguoi_tao: {
                        type: "string",
                        format: "uuid",
                        nullable: true,
                      },
                      nguoi_cap_nhat: { type: "string", format: "uuid" },
                      thoi_gian_tao: { type: "string", format: "date-time" },
                      thoi_gian_cap_nhat: {
                        type: "string",
                        format: "date-time",
                      },
                      is_approve: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description:
            "Dữ liệu không hợp lệ. Các trường hợp: ID rỗng, phản ánh không tồn tại, lĩnh vực mới trùng lĩnh vực hiện tại, lĩnh vực mới không tồn tại/không active, phản ánh đã giải quyết/đóng, người dùng không tồn tại.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: {
                    type: "string",
                    example: "Lĩnh vực phản ánh mới phải khác lĩnh vực hiện tại",
                  },
                  errors: { nullable: true },
                },
              },
            },
          },
        },
        401: { description: "Chưa xác thực hoặc token hết hạn" },
        403: {
          description: "Không có quyền PA_UPDATE_LINH_VUC",
        },
      },
    },
  },
  "/api/phan-anh/tong-quan": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy thống kê tổng quan phản ánh",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "preset",
          in: "query",
          required: false,
          schema: {
            type: "string",
            enum: ["today", "yesterday", "7days", "30days", "thisMonth", "thisQuarter", "custom"],
            default: "today",
          },
          description: "Preset thời gian; dùng custom khi truyền startDate và endDate",
        },
        {
          name: "idLinhVuc",
          in: "query",
          required: false,
          schema: { type: "string", format: "uuid" },
          description: "Lọc theo lĩnh vực; luôn bị giới hạn bởi permission/cate của tài khoản",
        },
        {
          name: "search",
          in: "query",
          required: false,
          schema: { type: "string", maxLength: 255 },
          description: "Tìm theo mã, tiêu đề, người phản ánh hoặc số điện thoại",
        },
        {
          name: "khuPho",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Lọc theo khu phố",
        },
        {
          name: "startDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
          description: "Ngày bắt đầu theo giờ Việt Nam; phải đi cùng endDate",
        },
        {
          name: "endDate",
          in: "query",
          required: false,
          schema: { type: "string", format: "date" },
          description: "Ngày kết thúc theo giờ Việt Nam; phải đi cùng startDate",
        },
      ],
      responses: {
        200: {
          description: "Lấy thống kê tổng quan phản ánh thành công",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string" },
                  data: {
                    type: "object",
                    properties: {
                      tong_so: { type: "integer", example: 1250 },
                      tong_hom_nay: { type: "integer", example: 18 },
                      tong_nguoi_dan: { type: "integer", example: 4520 },
                      ty_le_xu_ly: { type: "number", example: 88.5 },
                      qua_han: { type: "integer", example: 12 },
                      khan_cap: { type: "integer", example: 3 },
                      pt_nguoi_dan: { type: "number", example: 5.2 },
                      huong_nguoi_dan: { type: "string", enum: ["up", "down", "flat"] },
                      pt_phan_anh: { type: "number", example: 12.4 },
                      huong_phan_anh: { type: "string", enum: ["up", "down", "flat"] },
                      pt_ty_le_xu_ly: { type: "number", example: 2.1 },
                      huong_ty_le_xu_ly: { type: "string", enum: ["up", "down", "flat"] },
                      thong_ke_theo_trang_thai: { type: "object", additionalProperties: { type: "integer" } },
                      thong_ke_theo_khu_pho: { type: "array", items: { type: "object" } },
                      top_khu_pho: { type: "array", items: { type: "object" } },
                      ty_le_xu_ly_theo_khu_pho: { type: "array", items: { type: "object" } },
                      thong_ke_theo_linh_vuc: { type: "array", items: { type: "object" } },
                      thong_ke_theo_han_xu_ly: { type: "array", items: { type: "object" } },
                      xu_huong_phan_anh: { type: "array", items: { type: "object" } },
                      nhat_ky_hoat_dong: { type: "array", items: { type: "object" } },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Query thời gian hoặc UUID không hợp lệ" },
        401: { description: "Chưa xác thực hoặc token hết hạn" },
      },
    },
  },
  "/api/phan-anh/extension/request": {
    post: {
      tags: ["PhanAnhExtension"],
      summary: "Gửi đề nghị gia hạn phản ánh",
      security: [{ bearerAuth: [] }],
      description: "Yêu cầu PA_EXTENSION_CREATE; chỉ tạo cho phản ánh thuộc lĩnh vực trong cate của tài khoản.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["complaintId", "requestedDeadline", "reason"],
              properties: {
                complaintId: { type: "string", format: "uuid" },
                requestedDeadline: { type: "string", format: "date-time" },
                reason: { type: "string", minLength: 5, maxLength: 4000 },
                file: { type: "array", items: { type: "string", format: "binary" }, maxItems: 5 },
              },
            },
          },
        },
      },
      responses: { 200: { description: "Đã gửi đề nghị gia hạn thời gian xử lý thành công" }, 400: { description: "Dữ liệu hoặc deadline không hợp lệ" }, 403: { description: "Ngoài phạm vi lĩnh vực" }, 409: { description: "Đang có đề nghị chờ phê duyệt" } },
    },
  },
  "/api/phan-anh/extension": {
    get: {
      tags: ["PhanAnhExtension"],
      summary: "Lấy danh sách đề nghị gia hạn",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "status", in: "query", schema: { type: "string", enum: ["ALL", "PENDING", "APPROVED", "REJECTED"], default: "ALL" } },
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "size", in: "query", schema: { type: "integer", default: 10 } },
        { name: "search", in: "query", schema: { type: "string" } },
        { name: "mucDo", in: "query", schema: { type: "string", enum: ["KHAN_CAP", "BINH_THUONG"] } },
        { name: "idLinhVuc", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: { 200: { description: "Lấy danh sách đề nghị gia hạn thành công" }, 401: { description: "Chưa xác thực" }, 403: { description: "Không có permission hợp lệ" } },
    },
  },
  "/api/phan-anh/extension/{id}": {
    get: {
      tags: ["PhanAnhExtension"],
      summary: "Lấy chi tiết đề nghị gia hạn",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: { 200: { description: "Lấy chi tiết đề nghị gia hạn thành công" }, 403: { description: "Ngoài phạm vi lĩnh vực" }, 404: { description: "Không tồn tại" } },
    },
  },
  "/api/phan-anh/extension/{id}/approve": {
    put: {
      tags: ["PhanAnhExtension"],
      summary: "Phê duyệt đề nghị gia hạn",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: { content: { "application/json": { schema: { type: "object", properties: { ghiChu: { type: "string", maxLength: 2000 } } } } } },
      responses: { 200: { description: "Phê duyệt gia hạn thời gian giải quyết thành công" }, 400: { description: "Đề nghị không còn chờ phê duyệt" }, 403: { description: "Thiếu PA_EXTENSION_APPROVE" } },
    },
  },
  "/api/phan-anh/extension/{id}/reject": {
    put: {
      tags: ["PhanAnhExtension"],
      summary: "Từ chối đề nghị gia hạn",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["lyDoTuChoi"], properties: { lyDoTuChoi: { type: "string", minLength: 5, maxLength: 4000 } } } } } },
      responses: { 200: { description: "Đã từ chối đề nghị gia hạn" }, 400: { description: "Đề nghị không còn chờ phê duyệt" }, 403: { description: "Thiếu PA_EXTENSION_REJECT" } },
    },
  },
  "/api/phan-anh/{idPhanAnh}/nguoi-xu-ly": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy danh sách chuyên viên có thể xử lý phản ánh",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "idPhanAnh",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/assign/{idPhanAnh}": {
    put: {
      tags: ["PhanAnh"],
      summary: "Phân công hoặc chuyển phản ánh",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "idPhanAnh",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["idNguoiXuLy", "lyDo"],
              properties: {
                idNguoiXuLy: {
                  type: "string",
                  format: "uuid",
                },
                lyDo: {
                  type: "string",
                  maxLength: 1000,
                },
              },
            },
          },
        },
      },
      responses: {},
    },
  },
  "/api/phan-anh/muc-do-trang-thai-linh-vuc": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy mức độ và trạng thái phản ánh",
      responses: {},
    },
  },
  "/api/phan-anh/search-by-tieu-de": {
    get: {
      tags: ["PhanAnh"],
      summary: "Tìm kiếm phản ánh theo tiêu đề",
      parameters: [
        {
          name: "search",
          in: "query",
          required: true,
          schema: {
            type: "string",
            minLength: 3,
            maxLength: 255,
          },
          description: "Chuỗi tìm kiếm trong tiêu đề phản ánh",
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/public/create": {
    post: {
      tags: ["PhanAnh"],
      summary: "Tạo phản ánh mới từ công dân (không cần đăng nhập)",
      description:
        "API công khai để người dân tạo phản ánh. Khu phố và ít nhất một ảnh là bắt buộc; mô tả vị trí/mốc nhận diện không bắt buộc. Không nhận kinh độ/vĩ độ. Hỗ trợ tối đa 5 ảnh JPEG/PNG, mỗi ảnh tối đa 3 MB; video là tài liệu tùy chọn.",
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: PhanAnhSchemas.CreatePhanAnhPublicRequest,
          },
        },
        required: true,
      },
      responses: {
        200: {
          description: "Tạo phản ánh thành công",
        },
        400: {
          description:
            "Dữ liệu không hợp lệ, thiếu khu phố, thiếu hình ảnh hoặc lĩnh vực không tồn tại",
        },
      },
    },
  },
};

export default PhanAnhSwagger;
