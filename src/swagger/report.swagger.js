const ReportSwagger = {
  "/api/report/phan-anh": {
    get: {
      tags: ["Report"],
      security: [{ bearerAuth: [] }],
      summary: "Lấy báo cáo phản ánh",
      description:
        "API trả về danh sách phản ánh theo bộ lọc khoảng thời gian và lĩnh vực. Nếu truyền from/to thì lọc theo khoảng thời gian (giờ VN).",
      parameters: [
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
        {
          name: "id_linh_vuc",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "ID lĩnh vực. Nếu không truyền: lấy tất cả.",
        },
      ],
      responses: {},
    },
  },

  "/api/report/thu-tuc": {
    get: {
      tags: ["Report"],
      security: [{ bearerAuth: [] }],
      summary: "Lấy báo cáo thủ tục hành chính",
      description:
        "API trả về số lượng thủ tục hành chính theo lĩnh vực, bao gồm tổng số thủ tục, số thủ tục có mẫu đơn và không có mẫu đơn. Nếu truyền from/to thì lọc theo khoảng thời gian (giờ VN).",
      parameters: [
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
      ],
      responses: {},
    },
  },

  "/api/report/tin-tuc": {
    get: {
      tags: ["Report"],
      security: [{ bearerAuth: [] }],
      summary: "Lấy báo cáo tin tức",
      description:
        "API trả về số lượng tin tức đã xuất bản và chưa xuất bản theo ngày. Không cần truyền from/to.",
      parameters: [
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
      ],
      responses: {},
    },
  },

  "/api/report/phan-anh/export": {
    get: {
      tags: ["Report"],
      security: [{ bearerAuth: [] }],
      summary: "Xuất báo cáo phản ánh ra file Excel",
      description:
        "API xuất báo cáo phản ánh ra file Excel theo bộ lọc khoảng thời gian và lĩnh vực. Nếu truyền from/to thì lọc theo khoảng thời gian (giờ VN).",
      parameters: [
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
        {
          name: "idLinhVuc",
          in: "query",
          required: false,
          schema: {
            type: "string",
          },
          description: "ID lĩnh vực. Nếu không truyền: lấy tất cả.",
        },
      ],
      responses: {},
    },
  },

  "/api/report/thu-tuc/export": {
    get: {
      tags: ["Report"],
      security: [{ bearerAuth: [] }],
      summary: "Xuất báo cáo thủ tục hành chính ra file Excel",
      description:
        "API xuất báo cáo thủ tục hành chính ra file Excel theo bộ lọc khoảng thời gian. Nếu truyền from/to thì lọc theo khoảng thời gian (giờ VN).",
      parameters: [
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
      ],
      responses: {},
    },
  },

  "/api/report/tin-tuc/export": {
    get: {
      tags: ["Report"],
      security: [{ bearerAuth: [] }],
      summary: "Xuất báo cáo tin tức ra file Excel",
      description:
        "API xuất báo cáo tin tức ra file Excel theo bộ lọc khoảng thời gian. Nếu truyền from/to thì lọc theo khoảng thời gian (giờ VN).",
      parameters: [
        {
          name: "from",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
        {
          name: "to",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "date",
          },
          description:
            "Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.",
        },
      ],
      responses: {},
    },
  },
};

export default ReportSwagger;
