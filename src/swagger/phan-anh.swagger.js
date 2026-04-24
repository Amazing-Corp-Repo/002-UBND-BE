import PhanAnhSchemas from "../schemas/phan-anh.schema.js";

const PhanAnhSwagger = {
  "/api/phan-anh": {
    post: {
      tags: ["PhanAnh"],
      summary: "Tạo phản ánh mới",
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          "multipart/form-data": {
            schema: PhanAnhSchemas.CreatePhanAnhRequest,
          },
        },
        required: true,
      },
      responses: {},
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
          description: "Lọc theo trạng thái phản ánh",
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
                        - "desc": mới nhất trước(mặc định)
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
                        - "desc": mới nhất trước(mặc định)
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
          "application/json": {
            schema: PhanAnhSchemas.UpdatePhanAnhStatusRequest,
          },
        },
      },
      responses: {},
    },
  },
  "/api/phan-anh/tong-quan": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy tổng quát phản ánh",
      security: [{ bearerAuth: [] }],
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
          required: false,
          schema: {
            type: "string",
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
        "API công khai để người dân tạo phản ánh. Phản ánh sẽ chờ khu phố duyệt",
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
          description: "Tạo phản ánh thành công, đang chờ khu phố duyệt",
        },
        400: {
          description:
            "Dữ liệu không hợp lệ hoặc lĩnh vực/khu phố không tồn tại",
        },
      },
    },
  },
  "/api/phan-anh/pending-approval/list": {
    get: {
      tags: ["PhanAnh"],
      summary: "Lấy danh sách phản ánh chờ duyệt (Cho khu phố)",
      description:
        "Lấy danh sách phản ánh chưa được duyệt của khu phố hiện tại",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            default: 1,
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
          },
          description: "Số mục trên mỗi trang",
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
          description: "Sắp xếp theo thời gian",
        },
      ],
      responses: {
        200: {
          description: "Danh sách phản ánh chờ duyệt",
        },
        401: {
          description: "Không được xác thực",
        },
        403: {
          description: "Không có quyền duyệt phản ánh",
        },
      },
    },
  },
  "/api/phan-anh/approve-or-reject/{idPhanAnh}": {
    put: {
      tags: ["PhanAnh"],
      summary: "Duyệt hoặc từ chối phản ánh (Cho khu phố)",
      description: "Khu phố duyệt hoặc từ chối phản ánh được gửi đến",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "idPhanAnh",
          in: "path",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "ID phản ánh cần duyệt/từ chối",
        },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: PhanAnhSchemas.ApproveOrRejectPhanAnhRequest,
          },
        },
        required: true,
      },
      responses: {
        200: {
          description: "Duyệt hoặc từ chối phản ánh thành công",
        },
        400: {
          description: "Phản ánh không tồn tại hoặc đã được xử lý",
        },
        401: {
          description: "Không được xác thực",
        },
        403: {
          description: "Khu phố không có quyền duyệt phản ánh này",
        },
      },
    },
  },
};

export default PhanAnhSwagger;
