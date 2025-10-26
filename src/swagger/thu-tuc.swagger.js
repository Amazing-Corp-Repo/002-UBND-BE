const ThuTucSwagger = {
    '/api/thu-tucs': {
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
            responses: {
                200: {
                    description: 'Matching administrative procedures.',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean' },
                                    message: { type: 'string' },
                                    data: {
                                        type: 'array',
                                        items: { type: 'object' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

export default ThuTucSwagger;
