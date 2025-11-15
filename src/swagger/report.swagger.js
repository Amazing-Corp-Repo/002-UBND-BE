const ReportSwagger = {
    '/api/report/tong-hop': {
        get: {
            tags: ['Report'],
            security: [{ bearerAuth: [] }],
            summary: 'Lấy báo cáo tổng hợp phản ánh',
            description: 'API trả về tổng số phản ánh, số đã xử lý, số chưa xử lý, thời gian xử lý trung bình (giờ), và top 5 lĩnh vực theo số lượng phản ánh. Nếu truyền from/to thì lọc theo khoảng thời gian (giờ VN).',
            parameters: [
                {
                    name: 'from',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                },
                {
                    name: 'to',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                }
            ],
            responses: {}
        }
    },

    "/api/report/tong-hop/export-excel": {
        get: {
            tags: ["Report"],
            security: [{ bearerAuth: [] }],
            summary: "Xuất báo cáo tổng hợp ra file Excel",
            description: "Xuất file .xlsx chứa các số liệu báo cáo tổng hợp và top 5 lĩnh vực.",
            parameters: [
                {
                    name: 'from',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                },
                {
                    name: 'to',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                }
            ],
            responses: {}
        }
    },

    '/api/report/linh-vuc': {
        get: {
            tags: ['Report'],
            security: [{ bearerAuth: [] }],
            summary: 'Lấy báo cáo theo lĩnh vực',
            description: 'API trả về số lượng phản ánh và thời gian xử lý trung bình (giờ) theo từng lĩnh vực. Nếu truyền from/to thì lọc theo khoảng thời gian (giờ VN).',
            parameters: [
                {
                    name: 'from',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                },
                {
                    name: 'to',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                }
            ],
            responses: {}
        }
    },

    "/api/report/linh-vuc/export-excel": {
        get: {
            tags: ["Report"],
            security: [{ bearerAuth: [] }],
            summary: "Xuất báo cáo tổng hợp ra file Excel",
            description: "Xuất file .xlsx chứa các số liệu báo cáo tổng hợp và top 5 lĩnh vực.",
            parameters: [
                {
                    name: 'from',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                },
                {
                    name: 'to',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                }
            ],
            responses: {}
        }
    },

    '/api/report/trang-thai': {
        get: {
            tags: ['Report'],
            security: [{ bearerAuth: [] }],
            summary: 'Lấy báo cáo theo trạng thái xử lý',
            description: 'API trả về số lượng phản ánh và thời gian xử lý trung bình (giờ) theo từng trạng thái xử lý. Nếu truyền from/to thì lọc theo khoảng thời gian (giờ VN).',
            parameters: [
                {
                    name: 'from',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                },
                {
                    name: 'to',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                }
            ],
            responses: {}
        },
    },
    '/api/report/trang-thai/export-excel': {
        get: {
            tags: ["Report"],
            security: [{ bearerAuth: [] }],
            summary: "Xuất báo cáo trạng thái xử lý ra file Excel",
            description: "Xuất file .xlsx chứa các số liệu báo cáo trạng thái xử lý.",
            parameters: [
                {
                    name: 'from',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày bắt đầu (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                },
                {
                    name: 'to',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'date',
                    },
                    description: 'Ngày kết thúc (YYYY-MM-DD). Nếu không truyền: lấy tất cả.'
                }
            ],
            responses: {}
        }
    }
};

export default ReportSwagger;