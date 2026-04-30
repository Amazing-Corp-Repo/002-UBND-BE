import PhanAnhSchemas from "../schemas/phan-anh.schema.js";

const PhanAnhSwagger = {
  "/api/phan-anh": {
    post: {
      tags: ["PhanAnh"],
      summary: "Táº¡o pháº£n Ă¡nh má»›i",
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
          required: false,
          schema: {
            type: "string",
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
      description: "API công khai để người dân tạo phản ánh",
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
          description: "Dữ liệu không hợp lệ hoặc lĩnh vực không tồn tại",
        },
      },
    },
  },
};

export default PhanAnhSwagger;
