const ThuTucSwagger = {
    '/api/thu-tuc': {
        get: {
            tags: ['ThuTuc'],
            summary: 'List procedures with pagination',
            description: 'Return basic information for each procedure (thu tuc hanh chinh) using server-side pagination.',
            parameters: [
                {
                    name: 'keyword',
                    in: 'query',
                    description: 'Filter by procedure code, name, type name, or common conditions (max 255 chars).',
                },
                {
                    name: 'linhVucId',
                    in: 'query',
                    description: 'Field (linh vuc) identifier in UUID format to filter by domain.',
                },
            ],
        },
        responses: {},
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
                    description: 'Procedure id',
                },
            ],
            responses: {}
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
                    description: 'Procedure id',
                },
            ],
            responses: {}
        },
    },

    '/api/thu-tuc/{id}': {
        get: {
            tags: ['ThuTuc'],
            summary: 'Get procedure by id',
            description: 'Return the basic information of a single procedure by its identifier.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Procedure id',
                },
            ],
            responses: {}
        },
    }
};

export default ThuTucSwagger;
