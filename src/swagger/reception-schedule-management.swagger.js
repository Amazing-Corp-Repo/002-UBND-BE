import { ReceptionScheduleManagementSchemas } from "../schemas/reception-schedule-management.schema.js";

const ReceptionScheduleManagementSwagger = {
    '/api/reception-schedules/management/import': {
        post: {
            tags: ['ReceptionScheduleManagement'],
            summary: 'Import lịch tiếp dân từ file Excel',
            description: 'Đọc và kiểm tra toàn bộ file trước khi ghi dữ liệu. Mỗi dòng tạo lịch cùng các ca một tiếng, 8 quầy và sức chứa mặc định 2 người/quầy/ca. File được xử lý trong một transaction; nếu có dòng sai hoặc trùng thì không lưu dòng nào.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            required: ['file'],
                            properties: {
                                file: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'File Excel chứa dữ liệu lịch tiếp dân',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Import lịch tiếp dân và cấu hình slot thành công',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            importedCount: { type: 'integer', minimum: 1 },
                                            totalCounterSlots: { type: 'integer', minimum: 8 },
                                        },
                                    },
                                    message: { type: 'string', example: 'Import lịch tiếp dân thành công' },
                                    pagination: { nullable: true, example: null },
                                },
                            },
                        },
                    },
                },
                400: { description: 'Thiếu file, sai định dạng, file rỗng hoặc dữ liệu một dòng không hợp lệ' },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_CREATE' },
                409: { description: 'Trùng cán bộ và ngày tiếp dân trong file hoặc trong dữ liệu hiện có' },
            }
        },
    },
    '/api/reception-schedules/management': {
        get: {
            tags: ['ReceptionScheduleManagement'],
            security: [{ bearerAuth: [] }],
            summary: 'Lấy danh sách lịch tiếp dân với các bộ lọc',
            description: 'Dành cho cán bộ có quyền LTD_GET_ALL. Có thể lọc theo trạng thái và tối đa một loại thời gian: tuần/năm, tháng/năm hoặc ngày cụ thể. Kết quả không gồm lịch đã xóa mềm và được sắp xếp tăng dần theo ngày, giờ tiếp dân.',
            parameters: [
                {
                    name: 'weekYear',
                    in: 'query',
                    description: 'Tuần/năm trong định dạng tuần/năm (ví dụ: 45/2025)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '45/2025', // Tuần 45, năm 2025
                    },
                },
                {
                    name: 'monthYear',
                    in: 'query',
                    description: 'Tháng/năm trong định dạng tháng/năm (ví dụ: 12/2025)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '12/2025', // Tháng 12, năm 2025
                    },
                },
                {
                    name: 'date',
                    in: 'query',
                    description: 'Ngày (YYYY-MM-DD)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '2025-10-12', // Ngày 12/10/2025
                    },
                },
                {
                    name: 'isActive',
                    in: 'query',
                    description: 'Trạng thái hoạt động của lịch tiếp dân (true/false)',
                    required: false,
                    schema: {
                        type: 'boolean',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Lấy danh sách lịch tiếp dân thành công',
                    content: {
                        'application/json': {
                            schema: ReceptionScheduleManagementSchemas.ScheduleListSuccessSchema,
                        },
                    },
                },
                400: { description: 'Bộ lọc sai định dạng hoặc truyền đồng thời nhiều bộ lọc thời gian' },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_GET_ALL' },
            }
        },
        post: {
            tags: ['ReceptionScheduleManagement'],
            security: [{ bearerAuth: [] }],
            summary: 'Tạo mới lịch tiếp dân',
            description: 'Tạo lịch tiếp dân và tự sinh cấu hình slot cho 8 quầy, mặc định 2 người/quầy/ca. Nếu không truyền giờ, hệ thống dùng 07:30-11:30 và 13:30-16:30. Request cũ dùng batDau/ketThuc vẫn được hỗ trợ.',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: ReceptionScheduleManagementSchemas.CreateScheduleSchema,
                        examples: {
                            defaultWorkingHours: {
                                summary: 'Dùng thời gian làm việc mặc định',
                                value: {
                                    tenCanBo: 'Nguyễn Văn An',
                                    diaDiem: 'Bộ phận tiếp công dân',
                                    ngayTiepDan: '2026-08-25',
                                    ghiChu: 'Tiếp công dân định kỳ',
                                },
                            },
                            customWorkingHours: {
                                summary: 'Lãnh đạo cấu hình hai khoảng làm việc',
                                value: {
                                    tenCanBo: 'Nguyễn Văn An',
                                    diaDiem: 'Bộ phận tiếp công dân',
                                    ngayTiepDan: '2026-08-25',
                                    workingPeriods: [
                                        { startTime: '08:00', endTime: '11:00' },
                                        { startTime: '13:00', endTime: '16:00' },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Tạo lịch và các slot theo quầy thành công',
                    content: {
                        'application/json': {
                            schema: ReceptionScheduleManagementSchemas.ScheduleWithSlotsSuccessSchema,
                        },
                    },
                },
                400: { description: 'Dữ liệu hoặc khoảng thời gian không hợp lệ, hoặc lịch đã tồn tại' },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_CREATE' },
            }
        },
    },
    '/api/reception-schedules/management/pagination': {
        get: {
            tags: ['ReceptionScheduleManagement'],
            summary: 'Lấy danh sách lịch tiếp dân với các bộ lọc',
            parameters: [
                {
                    name: 'weekYear',
                    in: 'query',
                    description: 'Tuần/năm trong định dạng tuần/năm (ví dụ: 45/2025)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '45/2025', // Tuần 45, năm 2025
                    },
                },
                {
                    name: 'monthYear',
                    in: 'query',
                    description: 'Tháng/năm trong định dạng tháng/năm (ví dụ: 12/2025)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '12/2025', // Tháng 12, năm 2025
                    },
                },
                {
                    name: 'date',
                    in: 'query',
                    description: 'Ngày (YYYY-MM-DD)',
                    required: false,
                    schema: {
                        type: 'string',
                        example: '2025-10-12', // Ngày 12/10/2025
                    },
                },
                {
                    name: 'isActive',
                    in: 'query',
                    description: 'Trạng thái hoạt động của lịch tiếp dân (true/false)',
                    required: false,
                    schema: {
                        type: 'boolean',
                    },
                },
                {
                    name: 'page',
                    in: 'query',
                    description: 'Số trang hiện tại',
                    required: true,
                    schema: {
                        type: 'integer',
                        example: 1,
                    },
                },
                {
                    name: 'size',
                    in: 'query',
                    description: 'Số mục trên mỗi trang',
                    required: true,
                    schema: {
                        type: 'integer',
                        example: 10,
                    },
                },
            ],
            responses: {}
        },
    },
    '/api/reception-schedules/management/count': {
        get: {
            tags: ['ReceptionScheduleManagement'],
            summary: 'Đếm tổng số lịch tiếp dân (có thể áp dụng bộ lọc)',
            parameters: [
                {
                    name: 'weekYear',
                    in: 'query',
                    description: 'Tuần/năm (ví dụ: 45/2025)',
                    required: false,
                    schema: { type: 'string', example: '45/2025' },
                },
                {
                    name: 'monthYear',
                    in: 'query',
                    description: 'Tháng/năm (ví dụ: 12/2025)',
                    required: false,
                    schema: { type: 'string', example: '12/2025' },
                },
                {
                    name: 'date',
                    in: 'query',
                    description: 'Ngày (YYYY-MM-DD)',
                    required: false,
                    schema: { type: 'string', example: '2025-10-12' },
                },
            ],
            responses: {}
        },
    },
    '/api/reception-schedules/management/{id}': {
        delete: {
            tags: ['ReceptionScheduleManagement'],
            summary: 'Xoá lịch tiếp dân theo ID',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'ID của lịch tiếp dân cần xoá',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                        example: '123e4567-e89b-12d3-a456-426614174000',
                    },
                },
            ],
            responses: {}
        },
        get: {
            tags: ['ReceptionScheduleManagement'],
            summary: 'Lấy lịch tiếp dân theo ID',
            description: 'Trả về chi tiết lịch, từng ca một tiếng, cấu hình 8 quầy, sức chứa, số đăng ký đã giữ chỗ và số chỗ còn lại. Mọi đăng ký đã tạo đều được tính giữ chỗ, kể cả đăng ký đã bị từ chối hoặc xoá mềm.',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'ID của lịch tiếp dân cần lấy',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                        example: '123e4567-e89b-12d3-a456-426614174000',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Lấy chi tiết lịch tiếp dân thành công',
                    content: {
                        'application/json': {
                            schema: ReceptionScheduleManagementSchemas.ScheduleWithSlotsSuccessSchema,
                            example: {
                                success: true,
                                data: {
                                    id: '123e4567-e89b-12d3-a456-426614174000',
                                    ten_can_bo: 'Nguyễn Văn An',
                                    ngay_tiep_dan: '2026-08-26',
                                    slots: [{
                                        timeSlot: '07:30 - 08:30',
                                        totalCapacity: 16,
                                        heldCount: 3,
                                        unassignedHeldCount: 1,
                                        remainingCapacity: 13,
                                        isFull: false,
                                        counters: [{
                                            counterCode: 'QUAY_1',
                                            capacity: 2,
                                            heldCount: 1,
                                            remainingCapacity: 1,
                                            isFull: false,
                                        }],
                                    }],
                                },
                            },
                        },
                    },
                },
                400: { description: 'ID lịch không hợp lệ hoặc bị thiếu' },
                404: { description: 'Không tìm thấy lịch tiếp dân' },
            }
        },
        put: {
            tags: ['ReceptionScheduleManagement'],
            summary: 'Cập nhật lịch tiếp dân theo ID',
            description: 'Cập nhật thông tin lịch. Có thể truyền workingPeriods để cấu hình tối đa hai khoảng làm việc trong ngày; hệ thống tự sinh lại các ca một tiếng cho 8 quầy. Không được đổi ngày hoặc giờ khi lịch đã có bất kỳ đăng ký giữ chỗ nào.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'ID của lịch tiếp dân cần cập nhật',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid',
                        example: '123e4567-e89b-12d3-a456-426614174000',
                    },
                },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: ReceptionScheduleManagementSchemas.UpdateScheduleSchema,
                        example: {
                            tenCanBo: 'Nguyễn Văn An',
                            diaDiem: 'Bộ phận tiếp công dân',
                            ngayTiepDan: '2026-08-26',
                            workingPeriods: [
                                { startTime: '07:30', endTime: '11:30' },
                                { startTime: '13:30', endTime: '16:30' },
                            ],
                            ghiChu: 'Lịch đã được lãnh đạo điều chỉnh',
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Cập nhật lịch thành công',
                    content: {
                        'application/json': {
                            schema: ReceptionScheduleManagementSchemas.ScheduleWithSlotsSuccessSchema,
                        },
                    },
                },
                400: { description: 'Dữ liệu không hợp lệ, lịch trùng hoặc lịch đã có đăng ký giữ chỗ nên không thể đổi ngày/giờ' },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_UPDATE' },
                404: { description: 'Không tìm thấy lịch tiếp dân' },
            }
        },
    },
    '/api/reception-schedules/management/{id}/status': {
        put: {
            tags: ['ReceptionScheduleManagement'],
            summary: 'Cập nhật trạng thái hoạt động của lịch tiếp dân',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'ID của lịch tiếp dân cần cập nhật trạng thái',
                    required: true,
                    schema: {
                        type: 'string',
                        example: '123e4567-e89b-12d3-a456-426614174000',
                    },
                },
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: ReceptionScheduleManagementSchemas.UpdateStatusSchema,
                    },
                },
            },
            responses: {}
        },
    },
    '/api/reception-schedules/management/template': {
        get: {
            tags: ['ReceptionScheduleManagement'],
            security: [{ bearerAuth: [] }],
            summary: 'Lấy template lịch tiếp dân',
            responses: {}
        },
    },
}

export default ReceptionScheduleManagementSwagger;
