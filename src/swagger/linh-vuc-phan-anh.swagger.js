import LinhVucPhanAnhSchemas from "../schemas/linh-vuc-phan-anh.schema.js";

const LinhVucPhanAnhSwagger = {
    '/api/linh-vuc-phan-anh': {
        post: {
            tags: ['LinhVucPhanAnh'],
            summary: 'Tạo lĩnh vực phản ánh mới',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: LinhVucPhanAnhSchemas.CreateLinhVucPhanAnhRequest,
                    },
                },
            },
            responses: {},
        },
        get: {
            tags: ['LinhVucPhanAnh'],
            summary: 'Lấy danh sách lĩnh vực phản ánh',
            description: 'Lấy danh sách lĩnh vực phản ánh với phân trang và các bộ lọc tùy chọn.',
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
                    description: 'Số mục lĩnh vực phản ánh trên mỗi trang',
                },
                {
                    name: 'isActive',
                    in: 'query',
                    schema: { type: 'boolean' },
                    description: 'Bộ lọc để lấy lĩnh vực phản ánh đã bị xóa (true) hoặc chưa bị xóa (false).',
                },
                {
                    name: 'search',
                    in: 'query',
                    description: 'Từ khóa tìm kiếm trong tên lĩnh vực phản ánh.',
                    schema: { type: 'string' },
                }
            ],
            responses: {},
        },
    },
    '/api/linh-vuc-phan-anh/{id}': {
        put: {
            tags: ['LinhVucPhanAnh'],
            summary: 'Cập nhật lĩnh vực phản ánh',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh lĩnh vực phản ánh',
                },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: LinhVucPhanAnhSchemas.UpdateLinhVucPhanAnhRequest,
                    },
                },
            },
            responses: {},
        },
        get: {
            tags: ['LinhVucPhanAnh'],
            summary: 'Lấy chi tiết lĩnh vực phản ánh theo ID',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh lĩnh vực phản ánh',
                },
            ],
            responses: {},
        },
        delete: {
            tags: ['LinhVucPhanAnh'],
            summary: 'Xóa lĩnh vực phản ánh',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh lĩnh vực phản ánh',
                },
            ],
            responses: {},
        },
    },
    '/api/linh-vuc-phan-anh/update-status/{id}': {
        put: {
            tags: ['LinhVucPhanAnh'],
            summary: 'Cập nhật trạng thái hoạt động của lĩnh vực phản ánh',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh lĩnh vực phản ánh',
                },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: LinhVucPhanAnhSchemas.UpdateLinhVucPhanAnhStatusRequest,
                    },
                },
            },
            responses: {},
        },
    },
};

export default LinhVucPhanAnhSwagger;