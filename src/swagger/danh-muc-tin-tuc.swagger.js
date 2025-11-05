import DanhMucTinTucSchema from "../schemas/danh-muc-tin-tuc.schema.js";

const DanhMucTinTucSwagger = {
    '/api/danh-muc-tin-tuc': {
        post: {
            tags: ['DanhMucTinTuc'],
            summary: 'Tạo mới danh mục tin tức',
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    'application/json': {
                        schema: DanhMucTinTucSchema.CreateDanhMucTinTucRequest,
                    },
                },
                required: true,
            },
            responses: {}
        },
        get: {
            tags: ['DanhMucTinTuc'],
            summary: 'Lấy danh sách danh mục tin tức',
            parameters: [
                {
                    name: 'isActive',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'boolean',
                    },
                    description: 'Lọc theo trạng thái đã bị gỡ bỏ hay chưa',
                },
                {
                    name: 'search',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                    },
                    description: 'Từ khóa tìm kiếm trong tên danh mục tin tức',
                }
            ],
            responses: {}
        },
    },
    '/api/danh-muc-tin-tuc/{id}': {
        put: {
            tags: ['DanhMucTinTuc'],
            summary: 'Cập nhật danh mục tin tức',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                    },
                    description: 'ID của danh mục tin tức cần cập nhật',
                },
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: DanhMucTinTucSchema.UpdateDanhMucTinTucRequest,
                    },
                },
                required: true,
            },
            responses: {}
        },
        delete: {
            tags: ['DanhMucTinTuc'],
            summary: 'Xóa danh mục tin tức',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                    },
                    description: 'ID của danh mục tin tức cần xóa',
                },
            ],
            responses: {}
        },
        get: {
            tags: ['DanhMucTinTuc'],
            summary: 'Lấy thông tin chi tiết danh mục tin tức',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                    },
                    description: 'ID của danh mục tin tức cần lấy thông tin',
                },
            ],
            responses: {}
        },
    },
    '/api/danh-muc-tin-tuc/update-status/{id}': {
        put: {
            tags: ['DanhMucTinTuc'],
            summary: 'Cập nhật trạng thái hoạt động của danh mục tin tức',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                    },
                    description: 'ID của danh mục tin tức cần cập nhật trạng thái',
                },
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: DanhMucTinTucSchema.UpdateStatusDanhMucTinTucRequest,
                    },
                },
                required: true,
            },
            responses: {}
        }
    }
};

export default DanhMucTinTucSwagger;