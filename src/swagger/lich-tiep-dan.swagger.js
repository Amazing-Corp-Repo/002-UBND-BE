import { LichTiepDanSchemas } from "../schemas/lich-tiep-dan.schema.js";

const LichTiepDanSwagger = {
    '/api/lich-tiep-dan/import': {
        post: {
            tags: ['LichTiepDan'],
            summary: 'Import lịch tiếp dân từ file Excel',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                file: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'File Excel chứa dữ liệu lịch tiếp dân',
                                },
                            },
                        },
                    },
                },
            },
            responses: {}
        },
    },
    '/api/lich-tiep-dan': {
        get: {
            tags: ['LichTiepDan'],
            summary: 'Lấy danh sách lịch tiếp dân với các bộ lọc',
            parameters: [
                {
                    name: 'weekYear',
                    in: 'query',
                    description: 'Tuần/năm trong định dạng tuần/năm (ví dụ: 45/2025)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '45/2025', // Tuần 45, năm 2025
                    },
                },
                {
                    name: 'monthYear',
                    in: 'query',
                    description: 'Tháng/năm trong định dạng tháng/năm (ví dụ: 12/2025)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '12/2025', // Tháng 12, năm 2025
                    },
                },
                {
                    name: 'date',
                    in: 'query',
                    description: 'Ngày (YYYY-MM-DD)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '2025-10-12', // Ngày 12/10/2025
                    },
                },
                {
                    name: 'isActive',
                    in: 'query',
                    description: 'Trạng thái hoạt động của lịch tiếp dân (true/false)',
                    required: false,
                    schema: {
                        type: 'boolean',
                    },
                },
            ],
            responses: {}
        },
        post: {
            tags: ['LichTiepDan'],
            security: [{ bearerAuth: [] }],
            summary: 'Tạo mới lịch tiếp dân',
            description: 'Tạo lịch tiếp dân và tự sinh cấu hình slot cho 8 quầy, mặc định 2 người/quầy/ca. Nếu không truyền giờ, hệ thống dùng 07:30-11:30 và 13:30-16:30. Request cũ dùng batDau/ketThuc vẫn được hỗ trợ.',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: LichTiepDanSchemas.CreateLichTiepDanRequestSchemaSwagger,
                        examples: {
                            defaultWorkingHours: {
                                summary: 'Dùng thời gian làm việc mặc định',
                                value: {
                                    tenCanBo: 'Nguyễn Văn An',
                                    diaDiem: 'Bộ phận tiếp công dân',
                                    ngayTiepDan: '2026-08-25',
                                    ghiChu: 'Tiếp công dân định kỳ',
                                },
                            },
                            customWorkingHours: {
                                summary: 'Lãnh đạo cấu hình hai khoảng làm việc',
                                value: {
                                    tenCanBo: 'Nguyễn Văn An',
                                    diaDiem: 'Bộ phận tiếp công dân',
                                    ngayTiepDan: '2026-08-25',
                                    workingPeriods: [
                                        { startTime: '08:00', endTime: '11:00' },
                                        { startTime: '13:00', endTime: '16:00' },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Tạo lịch và các slot theo quầy thành công' },
                400: { description: 'Dữ liệu hoặc khoảng thời gian không hợp lệ, hoặc lịch đã tồn tại' },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_CREATE' },
            }
        },
    },
    '/api/lich-tiep-dan/pagination': {
        get: {
            tags: ['LichTiepDan'],
            summary: 'Lấy danh sách lịch tiếp dân với các bộ lọc',
            parameters: [
                {
                    name: 'weekYear',
                    in: 'query',
                    description: 'Tuần/năm trong định dạng tuần/năm (ví dụ: 45/2025)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '45/2025', // Tuần 45, năm 2025
                    },
                },
                {
                    name: 'monthYear',
                    in: 'query',
                    description: 'Tháng/năm trong định dạng tháng/năm (ví dụ: 12/2025)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '12/2025', // Tháng 12, năm 2025
                    },
                },
                {
                    name: 'date',
                    in: 'query',
                    description: 'Ngày (YYYY-MM-DD)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '2025-10-12', // Ngày 12/10/2025
                    },
                },
                {
                    name: 'isActive',
                    in: 'query',
                    description: 'Trạng thái hoạt động của lịch tiếp dân (true/false)',
                    required: false,
                    schema: {
                        type: 'boolean',
                    },
                },
                {
                    name: 'page',
                    in: 'query',
                    description: 'Số trang hiện tại',
                    required: true,
                    schema: {
                        type: 'integer',
                        example: 1,
                    },
                },
                {
                    name: 'size',
                    in: 'query',
                    description: 'Số mục trên mỗi trang',
                    required: true,
                    schema: {
                        type: 'integer',
                        example: 10,
                    },
                },
            ],
            responses: {}
        },
    },
    '/api/lich-tiep-dan/count': {
        get: {
            tags: ['LichTiepDan'],
            summary: 'Đếm tổng số lịch tiếp dân (có thể áp dụng bộ lọc)',
            parameters: [
                {
                    name: 'weekYear',
                    in: 'query',
                    description: 'Tuần/năm (ví dụ: 45/2025)',
                    required: false,
                    schema: { type: 'string', example: '45/2025' },
                },
                {
                    name: 'monthYear',
                    in: 'query',
                    description: 'Tháng/năm (ví dụ: 12/2025)',
                    required: false,
                    schema: { type: 'string', example: '12/2025' },
                },
                {
                    name: 'date',
                    in: 'query',
                    description: 'Ngày (YYYY-MM-DD)',
                    required: false,
                    schema: { type: 'string', example: '2025-10-12' },
                },
            ],
            responses: {}
        },
    },
    '/api/lich-tiep-dan/{id}': {
        delete: {
            tags: ['LichTiepDan'],
            summary: 'Xoá lịch tiếp dân theo ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'ID của lịch tiếp dân cần xoá',
                    required: true,
                    schema: {
                        type: 'string',
                        example: '123e4567-e89b-12d3-a456-426614174000',
                    },
                },
            ],
            responses: {}
        },
        get: {
            tags: ['LichTiepDan'],
            summary: 'Lấy lịch tiếp dân theo ID',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'ID của lịch tiếp dân cần lấy',
                    required: true,
                    schema: {
                        type: 'string',
                        example: '123e4567-e89b-12d3-a456-426614174000',
                    },
                },
            ],
            responses: {}
        },
        put: {
            tags: ['LichTiepDan'],
            summary: 'Cập nhật lịch tiếp dân theo ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'ID của lịch tiếp dân cần cập nhật',
                    required: true,
                    schema: {
                        type: 'string',
                        example: '123e4567-e89b-12d3-a456-426614174000',
                    },
                },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: LichTiepDanSchemas.UpdateLichTiepDanRequestSchemaSwagger,
                    },
                },
            },
            responses: {}
        },
    },
    '/api/lich-tiep-dan/update-status/{id}': {
        put: {
            tags: ['LichTiepDan'],
            summary: 'Cập nhật trạng thái hoạt động của lịch tiếp dân',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'ID của lịch tiếp dân cần cập nhật trạng thái',
                    required: true,
                    schema: {
                        type: 'string',
                        example: '123e4567-e89b-12d3-a456-426614174000',
                    },
                },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: LichTiepDanSchemas.UpdateLStatusLichTiepDanSchemaSwagger,
                    },
                },
            },
            responses: {}
        },
    },
    '/api/lich-tiep-dan/template': {
        get: {
            tags: ['LichTiepDan'],
            security: [{ bearerAuth: [] }],
            summary: 'Lấy template lịch tiếp dân',
            responses: {}
        },
    },
}

export default LichTiepDanSwagger;
