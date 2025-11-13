import CoSoDichVuCongSchemas from "../schemas/co-so-dich-vu-cong.schema.js";

const CoSoDichVuCongSwagger = {
    '/api/co-so-dich-vu-cong': {
        get: {
            tags: ['CoSoDichVuCong'],
            summary: 'Lấy danh sách Cơ sở dịch vụ công',
            description: 'Trả về danh sách các cơ sở dịch vụ công, tìm kiếm và lọc trạng thái.',
            parameters: [
                {
                    name: 'isActive',
                    in: 'query',
                    required: false,
                    schema: { type: 'boolean' },
                    description: 'Bộ lọc trạng thái. Nếu không có, sẽ không lọc theo trạng thái xóa.'
                },
                {
                    name: 'search',
                    in: 'query',
                    required: false,
                    description: 'Từ khóa tìm kiếm trong tên cơ sở.'
                }
            ],
            responses: {},
        },
        post: {
            tags: ['CoSoDichVuCong'],
            security: [{ bearerAuth: [] }],
            summary: 'Tạo mới một Cơ sở dịch vụ công',
            description: 'Tạo mới một bản ghi cơ sở dịch vụ công trong hệ thống.',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: CoSoDichVuCongSchemas.CreateCoSoDichVuCongRequest,
                    },
                },
            },
            responses: {},
        },
    },

    '/api/co-so-dich-vu-cong/pagination': {
        get: {
            tags: ['CoSoDichVuCong'],
            summary: 'Lấy danh sách Cơ sở dịch vụ công',
            description: 'Trả về danh sách các cơ sở dịch vụ công, tìm kiếm và lọc trạng thái.',
            parameters: [
                {
                    name: 'isActive',
                    in: 'query',
                    required: false,
                    schema: { type: 'boolean' },
                    description: 'Bộ lọc trạng thái. Nếu không có, sẽ không lọc theo trạng thái xóa.'
                },
                {
                    name: 'search',
                    in: 'query',
                    required: false,
                    description: 'Từ khóa tìm kiếm trong tên cơ sở.'
                },
                {
                    name: 'page',
                    in: 'query',
                    required: false,
                    schema: { type: 'integer', default: 1 },
                    description: 'Số trang hiện tại.'
                },
                {
                    name: 'size',
                    in: 'query',
                    required: false,
                    schema: { type: 'integer', default: 10 },
                    description: 'Số mục trên mỗi trang.'
                }
            ],
            responses: {},
        },
        post: {
            tags: ['CoSoDichVuCong'],
            security: [{ bearerAuth: [] }],
            summary: 'Tạo mới một Cơ sở dịch vụ công',
            description: 'Tạo mới một bản ghi cơ sở dịch vụ công trong hệ thống.',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: CoSoDichVuCongSchemas.CreateCoSoDichVuCongRequest,
                    },
                },
            },
            responses: {},
        },
    },

    '/api/co-so-dich-vu-cong/{id}': {
        get: {
            tags: ['CoSoDichVuCong'],
            summary: 'Lấy Cơ sở dịch vụ công theo ID',
            description: 'Trả về thông tin chi tiết của một cơ sở dịch vụ công dựa trên mã định danh duy nhất.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh của cơ sở dịch vụ công cần lấy thông tin',
                },
            ],
            responses: {},
        },
        put: {
            tags: ['CoSoDichVuCong'],
            security: [{ bearerAuth: [] }],
            summary: 'Cập nhật thông tin Cơ sở dịch vụ công',
            description: 'Cập nhật thông tin chi tiết của một cơ sở dịch vụ công dựa trên mã định danh duy nhất.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh của cơ sở dịch vụ công cần cập nhật thông tin',
                },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: CoSoDichVuCongSchemas.UpdateCoSoDichVuCongRequest,
                    },
                },
            },
            responses: {},
        },
        delete: {
            tags: ['CoSoDichVuCong'],
            security: [{ bearerAuth: [] }],
            summary: 'Xóa vĩnh viễn Cơ sở dịch vụ công theo ID',
            description: 'Xóa vĩnh viễn một cơ sở dịch vụ công khỏi cơ sở dữ liệu bằng mã định danh. Cơ sở dịch vụ công phải được đánh dấu là đã xóa trước khi thực hiện thao tác này.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh của cơ sở dịch vụ công cần xóa vĩnh viễn',
                },
            ],
            responses: {},
        },
    },
    '/api/co-so-dich-vu-cong/update-status/{id}': {
        put: {
            tags: ['CoSoDichVuCong'],
            security: [{ bearerAuth: [] }],
            summary: 'Cập nhật trạng thái hoạt động của Cơ sở dịch vụ công',
            description: 'Cập nhật trạng thái hoạt động (kích hoạt/hủy kích hoạt) của một cơ sở dịch vụ công dựa trên mã định danh duy nhất.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'Mã định danh của cơ sở dịch vụ công cần cập nhật trạng thái',
                },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: CoSoDichVuCongSchemas.UpdateStatusCoSoDichVuCongRequest,
                    },
                },
            },
            responses: {},
        },
    },
};

export default CoSoDichVuCongSwagger;