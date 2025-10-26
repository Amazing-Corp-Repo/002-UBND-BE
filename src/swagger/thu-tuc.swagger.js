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
};

export default ThuTucSwagger;
