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
                    name: 'year',
                    in: 'query',
                    description: 'Năm tiếp dân',
                    required: false,
                    schema: {
                        type: 'integer',
                        example: 2023,
                    },
                },
                {
                    name: 'month',
                    in: 'query',
                    description: 'Tháng tiếp dân (1-12)',
                    required: false,
                    schema: {
                        type: 'integer',
                        example: 5,
                    },
                },
                {
                    name: 'date',
                    in: 'query',
                    description: 'Ngày tiếp dân (YYYY-MM-DD)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '2023-05-15',
                    },
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
    },
}

export default LichTiepDanSwagger;