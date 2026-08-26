import PhanAnhSchemas from "../schemas/phan-anh.schema.js";

const PhanAnhSwagger = {
  "/api/phan-anh": {
    post: {
      tags: ["PhanAnh"],
      summary: "Tạo phản ánh mới (yêu cầu đăng nhập)",
      description:
        "Tạo phản ánh từ tài khoản có quyền PA_CREATE. Có thể gửi CCCD gồm 12 chữ số; khu phố là bắt buộc; mô tả vị trí/mốc nhận diện không bắt buộc. Không nhận kinh độ/vĩ độ. Hỗ trợ tối đa 5 ảnh JPEG/PNG, mỗi ảnh tối đa 5 MB, hoặc tối đa 5 idVideo đã tải lên trước đó.",
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
            "Dữ liệu không hợp lệ, thiếu khu phố, không có ảnh/video hoặc lĩnh vực không tồn tại",
        },
        401: { description: "Chưa đăng nhập hoặc token hết hạn" },
        403: { description: "Không có quyền PA_CREATE" },
      },
    },
    get: {
      tags: ["PhanAnh"],
      summary: "Láº¥y danh sĂ¡ch pháº£n Ă¡nh vá»›i phĂ¢n trang vĂ  lá»c sá»­ dá»¥ng trĂªn web",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "idLinhVucPhanAnh",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "Lá»c theo ID lÄ©nh vá»±c pháº£n Ă¡nh",
        },
        {
          name: "trangThai",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "Lá»c theo tráº¡ng thĂ¡i pháº£n Ă¡nh",
        },
        {
          name: "mucDo",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "Lá»c theo má»©c Ä‘á»™ pháº£n Ă¡nh",
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
          description: "Sá»‘ trang hiá»‡n táº¡i",
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
          description: "Sá»‘ má»¥c trĂªn má»—i trang",
        },
        {
          name: "maPhanAnh",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "Lá»c theo mĂ£ pháº£n Ă¡nh",
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
          description: `Sáº¯p xáº¿p theo thá»i gian táº¡o pháº£n Ă¡nh:
                        - "desc": má»›i nháº¥t trÆ°á»›c(máº·c Ä‘á»‹nh)
                        - "asc": cÅ© nháº¥t trÆ°á»›c`,
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/{maPhanAnh}/for-mobile": {
    get: {
      tags: ["PhanAnh"],
      summary: "Láº¥y thĂ´ng tin pháº£n Ă¡nh theo mĂ£ pháº£n Ă¡nh cho mobile",
      parameters: [
        {
          name: "maPhanAnh",
          in: "path",
          required: true,
          schema: {
            type: "string",
            pattern: "^[A-Z0-9]{8}$",
          },
          description: "MĂ£ pháº£n Ă¡nh cáº§n láº¥y thĂ´ng tin",
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/{idPhanAnh}/lich-su-trang-thai": {
    get: {
      tags: ["PhanAnh"],
      summary: "Láº¥y lá»‹ch sá»­ tráº¡ng thĂ¡i cá»§a pháº£n Ă¡nh",
      parameters: [
        {
          name: "idPhanAnh",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID cá»§a pháº£n Ă¡nh cáº§n láº¥y lá»‹ch sá»­ tráº¡ng thĂ¡i",
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/user/me": {
    get: {
      tags: ["PhanAnh"],
      summary: "Láº¥y danh sĂ¡ch pháº£n Ă¡nh cá»§a ngÆ°á»i dĂ¹ng hiá»‡n táº¡i",
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
          description: `Sáº¯p xáº¿p theo thá»i gian táº¡o pháº£n Ă¡nh:
                        - "desc": má»›i nháº¥t trÆ°á»›c(máº·c Ä‘á»‹nh)
                        - "asc": cÅ© nháº¥t trÆ°á»›c`,
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/muc-do": {
    get: {
      tags: ["PhanAnh"],
      summary: "Láº¥y má»©c Ä‘á»™ pháº£n Ă¡nh",
      responses: {},
    },
  },
  "/api/phan-anh/trang-thai": {
    get: {
      tags: ["PhanAnh"],
      summary: "Láº¥y tráº¡ng thĂ¡i pháº£n Ă¡nh",
      responses: {},
    },
  },
  "/api/phan-anh/{idPhanAnh}": {
    get: {
      tags: ["PhanAnh"],
      summary: "Láº¥y pháº£n Ă¡nh theo ID sá»­ dá»¥ng trĂªn web",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "idPhanAnh",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID cá»§a pháº£n Ă¡nh cáº§n láº¥y thĂ´ng tin",
        },
      ],
      responses: {},
    },
  },
  "/api/phan-anh/update-status/{idPhanAnh}": {
    put: {
      tags: ["PhanAnh"],
      summary: "Cáº­p nháº­t tráº¡ng thĂ¡i pháº£n Ă¡nh",
      security: [{ bearerAuth: [] }],
      description: "Cáº­p nháº­t tráº¡ng thĂ¡i pháº£n Ă¡nh theo ID",
      parameters: [
        {
          name: "idPhanAnh",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID pháº£n Ă¡nh cáº§n cáº­p nháº­t tráº¡ng thĂ¡i",
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
      summary: "Láº¥y tá»•ng quĂ¡t pháº£n Ă¡nh",
      security: [{ bearerAuth: [] }],
      responses: {},
    },
  },
  "/api/phan-anh/muc-do-trang-thai-linh-vuc": {
    get: {
      tags: ["PhanAnh"],
      summary: "Láº¥y má»©c Ä‘á»™ vĂ  tráº¡ng thĂ¡i pháº£n Ă¡nh",
      responses: {},
    },
  },
  "/api/phan-anh/search-by-tieu-de": {
    get: {
      tags: ["PhanAnh"],
      summary: "TĂ¬m kiáº¿m pháº£n Ă¡nh theo tiĂªu Ä‘á»",
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
          description: "Chuá»—i tĂ¬m kiáº¿m trong tiĂªu Ä‘á» pháº£n Ă¡nh",
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
        "API công khai để người dân tạo phản ánh. Có thể gửi CCCD gồm 12 chữ số; khu phố là bắt buộc; mô tả vị trí/mốc nhận diện không bắt buộc. Không nhận kinh độ/vĩ độ. Hỗ trợ tối đa 5 ảnh JPEG/PNG, mỗi ảnh tối đa 5 MB, hoặc tối đa 5 idVideo đã tải lên trước đó.",
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
            "Dữ liệu không hợp lệ, thiếu khu phố, không có ảnh/video hoặc lĩnh vực không tồn tại",
        },
      },
    },
  },
};

export default PhanAnhSwagger;
