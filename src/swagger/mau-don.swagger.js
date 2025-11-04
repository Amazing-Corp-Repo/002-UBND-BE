import MauDonSchemas from "../schemas/mau-don.schema.js";

const MauDonSwagger = {
    '/api/mau-don': {
        post: {
            tags: ['MauDon'],
            summary: 'Create Mau Don',
            security: [{ bearerAuth: [] }],
            description: 'Tạo mới mẫu đơn',
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: MauDonSchemas.CreateMauDonRequest,
                    }
                }
            },
            responses: {}
        },
        get: {
            tags: ['MauDon'],
            summary: 'Get All Mau Don',
            description: 'Lấy tất cả mẫu đơn; có thể lọc theo trạng thái hoạt động',
            parameters: [
                {
                    name: 'isActive',
                    in: 'query',
                    required: false,
                    schema: { type: 'boolean' },
                    description: 'Lọc theo trạng thái hoạt động (true hoặc false)',
                },
                {
                    name: 'search',
                    in: 'query',
                    required: false,
                    schema: { type: 'string' },
                    description: 'Từ khóa tìm kiếm trong tên mẫu đơn',
                }
            ],
            responses: {}
        }
    },
    '/api/mau-don/{id}': {
        put: {
            tags: ['MauDon'],
            summary: 'Update Mau Don',
            security: [{ bearerAuth: [] }],
            description: 'Cập nhật mẫu đơn theo ID',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'ID mẫu đơn cần cập nhật',
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: MauDonSchemas.UpdateMauDonRequest,
                    }
                }
            },
            responses: {}
        },
        delete: {
            tags: ['MauDon'],
            summary: 'Delete Mau Don',
            security: [{ bearerAuth: [] }],
            description: 'Xóa mẫu đơn theo ID',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'ID mẫu đơn cần xóa',
                }
            ],
            responses: {}
        }
    },
    '/api/mau-don/update-status/{id}': {
        put: {
            tags: ['MauDon'],
            summary: 'Update Mau Don Status',
            security: [{ bearerAuth: [] }],
            description: 'Cập nhật trạng thái hoạt động của mẫu đơn theo ID',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'ID mẫu đơn cần cập nhật trạng thái',
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: MauDonSchemas.UpdateStatusMauDonRequestSchema,
                    }
                }
            },
            responses: {}
        }
    }
};
export default MauDonSwagger;