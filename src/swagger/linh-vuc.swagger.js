const LinhVucSwagger = {
    '/api/linh-vuc': {
        get: {
            tags: ['LinhVuc'],
            summary: 'Lấy danh sách lĩnh vực',
            parameters: [
                {
                    name: 'is_removed',
                    in: 'query',
                    description: 'Bộ lọc lĩnh vực đã bị xóa hay chưa (true/false)',
                    required: false,
                    schema: {
                        type: 'boolean',
                    },
                },
            ],
            responses: {}
        },
    },
};

export default LinhVucSwagger;