import UyBanSchemas from "../schemas/uy-ban.schema.js";

const UyBanSwagger = {
    '/api/uy-ban': {
        post: {
            tags: ['UyBan'],
            summary: 'Tạo ủy ban mới',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: UyBanSchemas.CreateUyBanRequest,
                    },
                },
            },
            responses: {},
        },
        get: {
            tags: ['UyBan'],
            summary: 'Lấy ủy ban',
            responses: {},
        },
    },
    '/api/uy-ban/{id}': {
        put: {
            tags: ['UyBan'],
            summary: 'Cập nhật ủy ban',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                    },
                    description: 'ID của ủy ban cần cập nhật',
                },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: UyBanSchemas.UpdateUyBanRequest,
                    },
                },
            },
            responses: {},
        },
    },
};

export default UyBanSwagger;