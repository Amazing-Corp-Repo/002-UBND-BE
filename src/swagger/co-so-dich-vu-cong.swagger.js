import CoSoDichVuCongSchemas from '../schemas/co-so-dich-vu-cong.schema.js';

const CoSoDichVuCongSwagger = {
    '/api/co-so-dich-vu-cong': {
        get: {
            tags: ['Cơ Sở Dịch Vụ Công'],
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
            tags: ['Cơ Sở Dịch Vụ Công'],
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
            tags: ['Cơ Sở Dịch Vụ Công'],
            summary: 'Lấy thông tin Cơ sở dịch vụ công theo ID',
            description: 'Trả về thông tin chi tiết của một cơ sở dịch vụ công dựa trên ID.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'ID của cơ sở dịch vụ công (UUID).',
                    schema: { type: 'string', format: 'uuid' },
                },
            ],
            responses: {
                '200': {
                    description: 'Thông tin cơ sở dịch vụ công được trả về thành công.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CoSoDichVuCongDetail'
                            }
                        }
                    }
                },
                '404': { description: 'Không tìm thấy cơ sở dịch vụ công.' },
            },
        },
        put: {
            tags: ['Cơ Sở Dịch Vụ Công'],
            security: [{ bearerAuth: [] }],
            summary: 'Cập nhật thông tin Cơ sở dịch vụ công theo ID',
            description: 'Cập nhật thông tin chi tiết của một cơ sở dịch vụ công dựa trên ID.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'ID của cơ sở dịch vụ công (UUID).',
                    schema: { type: 'string', format: 'uuid' },
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
            responses: {
                '200': {
                    description: 'Cơ sở dịch vụ công được cập nhật thành công.',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CoSoDichVuCongDetail'
                            }
                        }
                    }
                },
                '400': { description: 'Dữ liệu không hợp lệ hoặc tên cơ sở đã tồn tại.' },
                '401': { description: 'Không được xác thực.' },
                '403': { description: 'Không có quyền truy cập.' },
                '404': { description: 'Không tìm thấy cơ sở dịch vụ công.' },
            },
        },
        delete: {
            tags: ['Cơ Sở Dịch Vụ Công'],
            security: [{ bearerAuth: [] }],
            summary: 'Xóa mềm Cơ sở dịch vụ công theo ID',
            description: 'Đánh dấu một cơ sở dịch vụ công là đã xóa (is_removed = true) dựa trên ID.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    description: 'ID của cơ sở dịch vụ công (UUID).',
                    schema: { type: 'string', format: 'uuid' },
                },
            ],
            responses: {
                '200': { description: 'Cơ sở dịch vụ công được xóa mềm thành công.' },
                '400': { description: 'Cơ sở dịch vụ công đã được xóa mềm.' },
                '401': { description: 'Không được xác thực.' },
                '403': { description: 'Không có quyền truy cập.' },
                '404': { description: 'Không tìm thấy cơ sở dịch vụ công.' },
            },
        },
    },
};

export default CoSoDichVuCongSwagger;