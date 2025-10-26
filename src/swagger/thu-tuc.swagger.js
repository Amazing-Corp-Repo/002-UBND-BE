const ThuTucSwagger = {
    '/api/thu-tuc': {
        get: {
            tags: ['ThuTuc'],
            summary: 'Search administrative procedures',
            description: 'Return administrative procedures filtered by keyword and/or field. Without filters it returns all records.',
            parameters: [
                {
                    name: 'keyword',
                    in: 'query',
                    required: false,
                    description: 'Filter by procedure code, name, type name, or common conditions (max 255 chars).',
                    schema: {
                        type: 'string',
                        maxLength: 255,
                    },
                },
                {
                    name: 'linhVucId',
                    in: 'query',
                    required: false,
                    description: 'Field (linh vuc) identifier in UUID format to filter by domain.',
                    schema: {
                        type: 'string',
                        format: 'uuid',
                    },
                },
            ],
            responses: {},
        },
    },
    '/api/thu-tuc/{id}/mau-don': {
        get: {
            tags: ['ThuTuc'],
            summary: 'Lấy danh sách mẫu đơn theo ID thủ tục',
            description: 'Lấy tất cả các mẫu đơn/biểu mẫu liên quan đến một thủ tục hành chính cụ thể',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    },
                    description: 'ID của thủ tục hành chính'
                }
            ],
            responses: {}
        }
    }
};

export default ThuTucSwagger;
