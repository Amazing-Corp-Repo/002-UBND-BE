import TinTucSchemas from "../schemas/tin-tuc.schema.js";

const TinTucSwagger = {
    '/api/tin-tuc/upload': {
        post: {
            tags: ['TinTuc'],
            summary: 'Upload tệp đính kèm cho tin tức',
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: TinTucSchemas.UploadFileDinhKemRequest,
                    },
                },
                required: true,
            },
            responses: {}
        },
    },
    '/api/tin-tuc/{id}': {
        put: {
            tags: ['TinTuc'],
            summary: 'Cập nhật tin tức',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                    },
                    description: 'ID của tin tức cần cập nhật',
                },
            ],
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: TinTucSchemas.UpdateDanhMucTinTucRequest,
                    },
                },
                required: true,
            },
            responses: {}
        },
        get: {
            tags: ['TinTuc'],
            summary: 'Lấy chi tiết tin tức',
            description: 'Trả về thông tin chi tiết của một tin tức theo mã định danh.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh tin tức',
                },
            ],
            responses: {}
        },
        delete: {
            tags: ['TinTuc'],
            security: [{ bearerAuth: [] }],
            summary: 'Xóa vĩnh viễn tin tức theo ID',
            description: 'Xóa vĩnh viễn một tin tức khỏi cơ sở dữ liệu bằng mã định danh.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh tin tức',
                },
            ],
            responses: {}
        },
    },
    '/api/tin-tuc': {
        get: {
            tags: ['TinTuc'],
            summary: 'Lấy danh sách tin tức',
            description: 'Lấy danh sách tin tức với phân trang và các bộ lọc tùy chọn.',
            parameters: [
                {
                    name: 'page',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'integer',
                        default: 1,
                    },
                    description: 'Số trang hiện tại',
                },
                {
                    name: 'size',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'integer',
                        default: 10,
                    },
                    description: 'Số mục tin tức trên mỗi trang',
                },
                {
                    name: 'isActive',
                    in: 'query',
                    schema: { type: 'boolean' },
                    description: 'Bộ lọc để lấy tin tức đã bị xóa (true) hoặc chưa bị xóa (false).',
                },
                {
                    name: 'idDanhMuc',
                    in: 'query',
                    description: 'Lọc tin tức theo ID danh mục tin tức.',
                    schema: { type: 'string', format: 'uuid' },
                },
                {
                    name: 'search',
                    in: 'query',
                    description: 'Từ khóa tìm kiếm trong tiêu đề tin tức.',
                    schema: { type: 'string' },
                }
            ],
            responses: {},
        },
        post: {
            tags: ['TinTuc'],
            security: [{ bearerAuth: [] }],
            summary: 'Tạo mới tin tức',
            description: 'Tạo mới một tin tức với các thông tin chi tiết liên quan.',
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: TinTucSchemas.CreateTinTucRequest,
                    },
                },
                required: true,
            },
            responses: {},
        },
    },
    '/api/tin-tuc/update-status/{id}': {
        put: {
            tags: ['TinTuc'],
            summary: 'Cập nhật trạng thái hoạt động của tin tức',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                    },
                    description: 'ID của tin tức cần cập nhật trạng thái',
                },
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: TinTucSchemas.UpdateTinTucStatusRequest,
                    },
                },
                required: true,
            },
            responses: {}
        },
    },
};

export default TinTucSwagger;