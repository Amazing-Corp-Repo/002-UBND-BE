import PhanAnhSchemas from "../schemas/phan-anh.schema.js";

const PhanAnhSwagger = {
    '/api/phan-anh': {
        post: {
            tags: ['PhanAnh'],
            summary: 'Tạo phản ánh mới',
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: PhanAnhSchemas.CreatePhanAnhRequest,
                    },
                },
                required: true,
            },
            responses: {},
        },
        get: {
            tags: ['PhanAnh'],
            summary: 'Lấy danh sách phản ánh với phân trang và lọc sử dụng trên web',
            security: [ { bearerAuth: [] } ],
            parameters: [
                {
                    name: 'idLinhVucPhanAnh',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                    },
                    description: 'Lọc theo ID lĩnh vực phản ánh',
                },
                {
                    name: 'trangThai',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                    },
                    description: 'Lọc theo trạng thái phản ánh',
                },
                {
                    name: 'mucDo',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                    },
                    description: 'Lọc theo mức độ phản ánh',
                },
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
                    description: 'Số mục trên mỗi trang',
                },
                {
                    name: 'maPhanAnh',
                    in: 'query',
                    required: false,
                    schema: {
                        type: 'string',
                    },
                    description: 'Lọc theo mã phản ánh',
                }
            ],
            responses: {},
        },
    },
    '/api/phan-anh/{maPhanAnh}/for-mobile': {
        get: {
            tags: ['PhanAnh'],
            summary: 'Lấy thông tin phản ánh theo mã phản ánh cho mobile',
            parameters: [
                {
                    name: 'maPhanAnh',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                    },
                    description: 'Mã phản ánh cần lấy thông tin',
                },
            ],
            responses: {},
        },
    },
    '/api/phan-anh/{idPhanAnh}/lich-su-trang-thai': {
        get: {
            tags: ['PhanAnh'],
            summary: 'Lấy lịch sử trạng thái của phản ánh',
            parameters: [
                {
                    name: 'idPhanAnh',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                    },
                    description: 'ID của phản ánh cần lấy lịch sử trạng thái',
                },
            ],
            responses: {},
        },
    },
    '/api/phan-anh/user/me': {
        get: {
            tags: ['PhanAnh'],
            summary: 'Lấy danh sách phản ánh của người dùng hiện tại',
            security: [ { bearerAuth: [] } ],
            responses: {},
        },
    },
    '/api/phan-anh/muc-do': {
        get: {
            tags: ['PhanAnh'],
            summary: 'Lấy mức độ phản ánh',
            responses: {},
        },
    },
    '/api/phan-anh/trang-thai': {
        get: {
            tags: ['PhanAnh'],
            summary: 'Lấy trạng thái phản ánh',
            responses: {},
        },
    },
    '/api/phan-anh/{idPhanAnh}': {
        get: {
            tags: ['PhanAnh'],
            summary: 'Lấy phản ánh theo ID sử dụng trên web',
            security: [ { bearerAuth: [] } ],
            parameters: [
                {
                    name: 'idPhanAnh',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                    },
                    description: 'ID của phản ánh cần lấy thông tin',
                },
            ],
            responses: {},
        },
    },
}

export default PhanAnhSwagger;