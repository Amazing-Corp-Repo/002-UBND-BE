const procedureBasicSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
        ten_thu_tuc: { type: 'string', example: 'Dang ky ket hon' },
        ma_thu_tuc: { type: 'string', example: 'DKKH001' },
        ten_loai_thu_tuc: { type: 'string', example: 'Thu tuc hanh chinh co ban' },
        ma_loai_thu_tuc: { type: 'string', example: 'TT001' },
        thoi_gian_tao: { type: 'string', format: 'date-time' },
        thoi_gian_cap_nhap: { type: 'string', format: 'date-time' },
        is_removed: { type: 'boolean', example: false },
    },
};

const procedureFullDetailsSchema = {
    allOf: [
        procedureBasicSchema,
        {
            type: 'object',
            properties: {
                thu_tuc_hanh_chinh_linh_vuc: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id_linh_vuc: { type: 'string', format: 'uuid' },
                            linh_vuc: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    ten_linh_vuc: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                co_so_dich_vu_cong: {
                    type: 'object',
                    nullable: true,
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        ten_co_so: { type: 'string' },
                        uy_ban: {
                            type: 'object',
                            nullable: true,
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                ten_don_vi: { type: 'string' },
                                dia_chi_tru_so: { type: 'string' },
                            },
                        },
                    },
                },
                trinh_tu_thuc_hien_thu_tuc: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            ten_buoc: { type: 'string' },
                            mo_ta_buoc: { type: 'string' },
                            thu_tu_buoc: { type: 'integer' },
                        },
                    },
                },
                thu_tuc_hanh_chinh_mau_don: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id_mau_don: { type: 'string', format: 'uuid' },
                            ghi_chu: { type: 'string' },
                            mau_don: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    ten_mau_don: { type: 'string' },
                                    link_tai_lieu: { type: 'string', format: 'uri' },
                                },
                            },
                        },
                    },
                },
                cach_thuc_thuc_hien: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            hinh_thuc_ap_dung: { type: 'string' },
                            le_phi: { type: 'number', format: 'float' },
                            thoi_han_giai_quyet: { type: 'string' },
                        },
                    },
                },
            },
        },
    ],
};

const listResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Lay danh sach thu tuc thanh cong' },
        data: {
            type: 'object',
            properties: {
                procedures: { type: 'array', items: procedureBasicSchema },
                total: { type: 'integer', example: 42 },
                page: { type: 'integer', example: 1 },
                size: { type: 'integer', example: 10 },
                totalPages: { type: 'integer', example: 5 },
            },
        },
        pagintation: {
            type: ['object', 'null'],
            nullable: true,
            description: 'This field is null for this endpoint but returned to keep response shape consistent',
        },
    },
};

const basicDetailResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Lay thu tuc thanh cong' },
        data: procedureBasicSchema,
        pagintation: { type: ['object', 'null'], nullable: true },
    },
};

const fullDetailResponseSchema = {
    type: 'object',
    properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Lay thu tuc chi tiet thanh cong' },
        data: procedureFullDetailsSchema,
        pagintation: { type: ['object', 'null'], nullable: true },
    },
};

const ThuTucSwagger = {
    '/api/thu-tuc': {
        get: {
            tags: ['Thu Tuc'],
            summary: 'List procedures with pagination',
            description: 'Return basic information for each procedure (thu tuc hanh chinh) using server-side pagination.',
            parameters: [
                {
                    name: 'page',
                    in: 'query',
                    schema: { type: 'integer', minimum: 1, default: 1 },
                    description: 'Page number (defaults to 1)',
                },
                {
                    name: 'size',
                    in: 'query',
                    schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
                    description: 'Page size (max 100, defaults to 10)',
                },
            ],
            responses: {
                200: {
                    description: 'Procedures fetched successfully',
                    content: {
                        'application/json': {
                            schema: listResponseSchema,
                        },
                    },
                },
                400: {
                    description: 'Invalid paging parameters',
                },
            },
        },
    },
    '/api/thu-tuc/{id}': {
        get: {
            tags: ['Thu Tuc'],
            summary: 'Get procedure by id',
            description: 'Return the basic information of a single procedure by its identifier.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' },
                    description: 'Procedure id',
                },
            ],
            responses: {
                200: {
                    description: 'Procedure found',
                    content: {
                        'application/json': {
                            schema: basicDetailResponseSchema,
                        },
                    },
                },
                404: { description: 'Procedure not found' },
                400: { description: 'Invalid id supplied' },
            },
        },
    },
    '/api/thu-tuc/{id}/details': {
        get: {
            tags: ['Thu Tuc'],
            summary: 'Get procedure full details',
            description: 'Return the full relational view of a procedure including linh vuc, mau don, cac buoc thuc hien, and cach thuc thuc hien.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' },
                    description: 'Procedure id',
                },
            ],
            responses: {
                200: {
                    description: 'Procedure details fetched',
                    content: {
                        'application/json': {
                            schema: fullDetailResponseSchema,
                        },
                    },
                },
                404: { description: 'Procedure not found' },
                400: { description: 'Invalid id supplied' },
            },
        },
    },
};

export default ThuTucSwagger;
