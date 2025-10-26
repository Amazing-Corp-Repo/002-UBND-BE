const ThuTucSwagger = {
    '/api/thu-tuc': {
        get: {
            tags: ['Thu Tuc'],
            summary: 'List procedures with pagination',
            description: 'Return basic information for each procedure (thu tuc hanh chinh) using server-side pagination.',
            parameters: [
                {
                    name: 'page',
                    in: 'query',
                    schema: { type: 'integer', minimum: 1, default: 1 },
                    description: 'Page number (defaults to 1)',
                },
                {
                    name: 'size',
                    in: 'query',
                    schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                    description: 'Page size (max 100, defaults to 10)',
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
    '/api/thu-tuc/{id}': {
        get: {
            tags: ['Thu Tuc'],
            summary: 'Get procedure by id',
            description: 'Return the basic information of a single procedure by its identifier.',
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
                    schema: { type: 'string', format: 'uuid' },
                    description: 'Procedure id',
                },
            ],
            responses:{}
        },
    },
    '/api/thu-tuc/{id}/details': {
        get: {
            tags: ['Thu Tuc'],
            summary: 'Get procedure full details',
            description: 'Return the full relational view of a procedure including linh vuc, mau don, cac buoc thuc hien, and cach thuc thuc hien.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' },
                    description: 'Procedure id',
                },
            ],
            responses: {}
        },
    },
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
