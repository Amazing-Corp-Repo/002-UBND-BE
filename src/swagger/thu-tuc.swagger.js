import ThuTucSchemas from '../schemas/thu-tuc.schema.js';

const ThuTucSwagger = {
    '/api/thu-tuc': {
        get: {
            tags: ['ThuTuc'],
            summary: 'Danh sách thủ tục với phân trang',
            description: 'Trả về thông tin cơ bản của mỗi thủ tục hành chính sử dụng phân trang phía server.',
            parameters: [
                {
                    name: 'idLinhVuc',
                    in: 'query',
                    description: 'Mã định danh lĩnh vực ở định dạng UUID để lọc theo lĩnh vực.',
                },
                {
                    name: 'page',
                    in: 'query',
                    required: true,
                    schema: { type: 'integer', minimum: 1 },
                    description: 'Page number for pagination'
                },
                {
                    name: 'size',
                    in: 'query',
                    required: true,
                    schema: { type: 'integer', minimum: 1 },
                    description: 'Number of users per page'
                },
                {
                    name: 'isActive',
                    in: 'query',
                    description: 'Bộ lọc để lấy thủ tục đã bị xóa (true) hoặc chưa bị xóa (false).',
                    schema: { type: 'boolean' },
                },
                {
                    name: 'search',
                    in: 'query',
                    description: 'Từ khóa tìm kiếm trong mã thủ tục, tên thủ tục.',
                    schema: { type: 'string' },
                }
            ],
            responses: {},
        },
        post: {
            tags: ['ThuTuc'],
            security: [{ bearerAuth: [] }],
            summary: 'Tạo mới thủ tục',
            description: 'Tạo mới một thủ tục hành chính với các thông tin chi tiết liên quan.',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: ThuTucSchemas.CreateThuTucRequest,
                    },
                },
            },
            responses: {},
        },
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
                    description: 'Mã định danh thủ tục',
                },
            ],
            responses: {}
        },
    },
    '/api/thu-tuc/{id}': {
        get: {
            tags: ['ThuTuc'],
            summary: 'Lấy thủ tục theo ID',
            description: 'Trả về thông tin cơ bản của một thủ tục theo mã định danh.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh thủ tục',
                },
            ],
            responses: {}
        },
        delete: {
            tags: ['ThuTuc'],
            security: [{ bearerAuth: [] }],
            summary: 'Xóa vĩnh viễn thủ tục theo ID',
            description: 'Xóa vĩnh viễn một thủ tục khỏi cơ sở dữ liệu bằng mã định danh.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh thủ tục',
                },
            ],
            responses: {}
        },
        put: {
            tags: ['ThuTuc'],
            security: [{ bearerAuth: [] }],
            summary: 'Cập nhật thủ tục theo ID',
            description: 'Cập nhật thông tin chi tiết của một thủ tục hành chính theo mã định danh.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh thủ tục',
                },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: ThuTucSchemas.UpdateThuTucRequest,
                    },
                },
            },
            responses: {}
        },
    },
    '/api/thu-tuc/all': {
        get: {
            tags: ['ThuTuc'],
            summary: 'Lấy danh sách thủ tục cho mobile',
            description: 'Lấy tất cả các thủ tục hành chính, có thể lọc theo lĩnh vực, dành cho ứng dụng mobile.',
            parameters: [
                {
                    name: 'idLinhVuc',
                    in: 'query',
                    description: 'Mã định danh lĩnh vực ở định dạng UUID để lọc theo lĩnh vực.',
                },
                {
                    name: 'page',
                    in: 'query',
                    required: true,
                    schema: { type: 'integer', minimum: 1 },
                    description: 'Page number for pagination'
                },
                {
                    name: 'size',
                    in: 'query',
                    required: true,
                    schema: { type: 'integer', minimum: 1 },
                    description: 'Number of users per page'
                }
            ],
            responses: {},
        },
    },
    '/api/thu-tuc/update-status/{id}': {
        put: {
            tags: ['ThuTuc'],
            security: [{ bearerAuth: [] }],
            summary: 'Cập nhật trạng thái hoạt động của thủ tục theo ID',
            description: 'Cập nhật trạng thái hoạt động (kích hoạt/hủy kích hoạt) cho một thủ tục hành chính theo mã định danh',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh thủ tục',
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: ThuTucSchemas.UpdateThuTucStatusRequest,
                    }
                }
            },
            responses: {}
        }
    },
    '/api/thu-tuc/{id}/thanh-phan': {
        get: {
            tags: ['ThuTuc'],
            summary: 'Lấy thành phần thủ tục theo ID thủ tục',
            description: 'Lấy tất cả các thành phần hồ sơ liên quan đến một thủ tục hành chính cụ thể',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh thủ tục',
                },
            ],
            responses: {}
        },
    },
    '/api/thu-tuc/search': {
        get: {
            tags: ['ThuTuc'],
            summary: 'Tìm kiếm thủ tục hành chính',
            description: 'Tìm kiếm thủ tục hành chính theo từ khóa trong mã hoặc tên thủ tục.',
            parameters: [
                {
                    name: 'search',
                    in: 'query',
                    description: 'Từ khóa tìm kiếm trong mã thủ tục, tên thủ tục.',
                    schema: { type: 'string' },
                },
            ],
            responses: {},
        },
    },
};

export default ThuTucSwagger;
