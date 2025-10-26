const ThuTucSwagger = {
    '/api/thu-tuc': {
        get: {
            tags: ['Thu Tuc'],
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
};

export default ThuTucSwagger;
