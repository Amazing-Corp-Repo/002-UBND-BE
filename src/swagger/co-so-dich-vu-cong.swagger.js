import CoSoDichVuCongSchemas from "../schemas/co-so-dich-vu-cong.schema.js";

const CoSoDichVuCongSwagger = {
    '/api/co-so-dich-vu-cong': {
        get: {
            tags: ['CoSoDichVuCong'],
            summary: 'Lấy danh sách Cơ sở dịch vụ công',
            description: 'Trả về danh sách các cơ sở dịch vụ công với phân trang, tìm kiếm và lọc trạng thái xóa mềm.',
            parameters: [
                {
                    name: 'isRemoved',
                    in: 'query',
                    required: false,
                    schema: { type: 'boolean' },
                    description: 'Bộ lọc trạng thái xóa mềm (true/false). Nếu không có, sẽ không lọc theo trạng thái xóa.'
                },
                {
                    name: 'search',
                    in: 'query',
                    required: false,
                    description: 'Từ khóa tìm kiếm trong tên cơ sở, địa chỉ, số điện thoại.'
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
};

export default CoSoDichVuCongSwagger;