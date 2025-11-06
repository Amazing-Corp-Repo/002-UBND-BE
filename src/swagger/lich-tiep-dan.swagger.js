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
                }
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