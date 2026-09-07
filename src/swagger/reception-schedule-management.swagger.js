import { ReceptionScheduleManagementSchemas } from "../schemas/reception-schedule-management.schema.js";
import {
    applyReceptionDemoExamples,
    errorDemo,
    successDemo,
} from "./reception-demo-example.util.js";
import { RECEPTION_SWAGGER_DEMO as DEMO } from "./reception-swagger-demo.fixture.js";

const ReceptionScheduleManagementSwagger = {
    '/api/reception-schedules/management/import': {
        post: {
            tags: ['ReceptionScheduleManagement'],
            summary: 'Import lịch tiếp dân từ file Excel',
            description: 'Dành cho tài khoản có quyền LTD_CREATE. Backend lấy toàn bộ danh sách cán bộ và quầy xuất hiện trong file làm nguồn xếp lịch; mỗi buổi đều được bổ sung đủ toàn bộ các quầy đó, kể cả khi riêng buổi đó thiếu một vài dòng quầy. Backend xếp ngẫu nhiên cán bộ theo từng buổi, không random theo ca một tiếng: cán bộ được giữ nguyên quầy trong toàn bộ buổi sáng 07:30-11:30; sang buổi chiều 13:30-16:30 danh sách được trộn lại độc lập. File phải có số cán bộ hợp lệ ít nhất bằng số quầy. Việc tạo lịch, ca, cấu hình quầy và phân công được lưu trong cùng một transaction. Khi overwrite=true, lịch cùng ngày/địa điểm chưa có đơn đăng ký sẽ được thay thế và random lại; nếu đã có đơn thì toàn bộ import bị từ chối.',
            security: [{ bearerAuth: [] }],
            parameters: [{
                name: 'overwrite',
                in: 'query',
                required: false,
                description: 'Đặt true để ghi đè lịch cùng ngày/địa điểm và random lại cán bộ. Backend từ chối nếu lịch cũ đã có đơn đăng ký.',
                schema: { type: 'boolean', default: false, example: true },
            }],
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
                                            assignmentMode: { type: 'string', enum: ['RANDOM'], example: 'RANDOM', description: 'Chế độ tự động xếp ngẫu nhiên cán bộ vào quầy khi import.' },
                                            assignmentScope: { type: 'string', enum: ['SESSION'], example: 'SESSION', description: 'Random theo buổi sáng/chiều; không đổi quầy giữa các ca một tiếng trong cùng buổi.' },
                                            overwriteApplied: { type: 'boolean', example: true },
                                            overwrittenCount: { type: 'integer', minimum: 0, example: 1 },
                                            importedCount: { type: 'integer', minimum: 1 },
                                            importedRowCount: { type: 'integer', minimum: 1 },
                                            generatedAssignmentRowCount: { type: 'integer', minimum: 1, description: 'Số dòng phân công được backend sinh sau khi bổ sung đủ quầy cho từng buổi.' },
                                            totalCounterSlots: { type: 'integer', minimum: 1 },
                                            totalAssignments: { type: 'integer', minimum: 1 },
                                            dateFrom: { type: 'string', format: 'date', example: '2026-09-09' },
                                            dateTo: { type: 'string', format: 'date', example: '2026-09-30' },
                                            importedDates: {
                                                type: 'array',
                                                items: { type: 'string', format: 'date' },
                                            },
                                            importedRows: {
                                                type: 'array',
                                                description: 'Kết quả cán bộ đã được backend xếp ngẫu nhiên và lưu thực tế theo từng quầy.',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        rowNumber: { type: 'integer', example: 2 },
                                                        receptionDate: { type: 'string', format: 'date', example: '2026-09-09' },
                                                        startTime: { type: 'string', example: '07:30' },
                                                        endTime: { type: 'string', example: '11:30' },
                                                        counterCode: { type: 'string', example: 'QUAY_1' },
                                                        counterName: { type: 'string', example: 'Quầy số 1' },
                                                        officerUsername: { type: 'string', example: 'canbo1' },
                                                        officerFullName: { type: 'string', example: 'Nguyễn Văn An' },
                                                        capacity: { type: 'integer', minimum: 1, example: 2 },
                                                        location: { type: 'string', example: 'Bộ phận tiếp công dân' },
                                                        note: { type: 'string', nullable: true, example: 'Ca sáng - phân công luân phiên' },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    message: { type: 'string', example: 'Import lịch tiếp dân thành công' },
                                    pagination: { nullable: true, example: null },
                                },
                            },
                        },
                    },
                },
                400: { description: 'Thiếu file, sai định dạng, file rỗng, sai quầy/tài khoản/sức chứa hoặc cán bộ chưa có quyền RR_APPROVE' },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_CREATE' },
                409: { description: 'Trùng lịch khi overwrite=false; hoặc lịch cần ghi đè đã có đơn đăng ký; hoặc dữ liệu trong file trùng quầy/cán bộ trong ca' },
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
            security: [{ bearerAuth: [] }],
            summary: 'Lấy danh sách lịch tiếp dân có phân trang',
            description: 'Dành cho cán bộ có quyền LTD_GET_ALL. Hỗ trợ tối đa một bộ lọc thời gian, lọc trạng thái, phân trang mặc định trang 1 với 10 bản ghi và giới hạn tối đa 100 bản ghi mỗi trang.',
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
                    required: false,
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        default: 1,
                        example: 1,
                    },
                },
                {
                    name: 'size',
                    in: 'query',
                    description: 'Số mục trên mỗi trang',
                    required: false,
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 100,
                        default: 10,
                        example: 10,
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Lấy danh sách lịch tiếp dân có phân trang thành công',
                    content: {
                        'application/json': {
                            schema: ReceptionScheduleManagementSchemas.SchedulePaginationSuccessSchema,
                        },
                    },
                },
                400: { description: 'Bộ lọc, số trang hoặc kích thước trang không hợp lệ' },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_GET_ALL' },
            }
        },
    },
    '/api/reception-schedules/management/count': {
        get: {
            tags: ['ReceptionScheduleManagement'],
            security: [{ bearerAuth: [] }],
            summary: 'Đếm tổng số lịch tiếp dân (có thể áp dụng bộ lọc)',
            description: 'Dành cho cán bộ có quyền LTD_GET_ALL. Đếm đồng thời tổng số lịch, số lịch đang hoạt động và số lịch ngừng hoạt động. Chỉ được truyền tối đa một bộ lọc thời gian: tuần/năm, tháng/năm hoặc ngày.',
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
            responses: {
                200: {
                    description: 'Đếm lịch tiếp dân thành công',
                    content: {
                        'application/json': {
                            schema: ReceptionScheduleManagementSchemas.ScheduleCountSuccessSchema,
                        },
                    },
                },
                400: { description: 'Bộ lọc sai định dạng hoặc truyền đồng thời nhiều bộ lọc thời gian' },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_GET_ALL' },
            }
        },
    },
    '/api/reception-schedules/management/{id}': {
        delete: {
            tags: ['ReceptionScheduleManagement'],
            summary: 'Xoá lịch tiếp dân theo ID',
            description: 'Dành cho tài khoản có quyền LTD_DELETE. Chỉ được xóa mềm lịch đã ngừng hoạt động và chưa có bất kỳ đăng ký giữ chỗ nào. Việc kiểm tra đăng ký và cập nhật xóa mềm được thực hiện trong cùng transaction.',
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
            responses: {
                200: {
                    description: 'Xóa mềm lịch tiếp dân thành công',
                    content: {
                        'application/json': {
                            schema: ReceptionScheduleManagementSchemas.EmptySuccessSchema,
                        },
                    },
                },
                400: { description: 'ID lịch tiếp dân không đúng định dạng UUID' },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_DELETE' },
                404: { description: 'Lịch tiếp dân không tồn tại hoặc đã bị xóa' },
                409: { description: 'Lịch đang hoạt động hoặc đã có đăng ký giữ chỗ' },
            }
        },
        get: {
            tags: ['ReceptionScheduleManagement'],
            security: [{ bearerAuth: [] }],
            summary: 'Lấy lịch tiếp dân theo ID',
            description: 'Dành cho cán bộ có quyền LTD_GET_ALL. Trả về chi tiết lịch, shiftId của từng ca, counterId/cấu hình 8 quầy, sức chứa, số đăng ký đã giữ chỗ và số chỗ còn lại. Backend ghép đơn theo id_cau_hinh_quay và chỉ fallback bo_phan cho dữ liệu cũ. Mọi đăng ký đã tạo đều được tính giữ chỗ, kể cả đăng ký đã bị từ chối hoặc xoá mềm.',
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
                                            id: '223e4567-e89b-42d3-a456-426614174001',
                                            shiftId: '323e4567-e89b-42d3-a456-426614174001',
                                            counterId: '423e4567-e89b-42d3-a456-426614174001',
                                            counterCode: 'QUAY_1',
                                            counterName: 'Quầy số 1',
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
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_GET_ALL' },
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
            description: 'Dành cho tài khoản có quyền LTD_UPDATE_STATUS. Có thể bật lại lịch hợp lệ. Khi tắt lịch, backend từ chối nếu đã có bất kỳ đăng ký giữ chỗ nào; việc kiểm tra và cập nhật được thực hiện trong cùng transaction.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'ID của lịch tiếp dân cần cập nhật trạng thái',
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
                        schema: ReceptionScheduleManagementSchemas.UpdateStatusSchema,
                    },
                },
            },
            responses: {
                200: {
                    description: 'Cập nhật trạng thái lịch tiếp dân thành công',
                    content: {
                        'application/json': {
                            schema: ReceptionScheduleManagementSchemas.ScheduleItemSuccessSchema,
                        },
                    },
                },
                400: { description: 'ID hoặc body trạng thái không hợp lệ' },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_UPDATE_STATUS' },
                404: { description: 'Lịch tiếp dân không tồn tại hoặc đã bị xóa' },
                409: { description: 'Không thể ngừng lịch đã có đăng ký giữ chỗ' },
            }
        },
    },
    '/api/reception-schedules/management/template': {
        get: {
            tags: ['ReceptionScheduleManagement'],
            security: [{ bearerAuth: [] }],
            summary: 'Lấy template lịch tiếp dân',
            description: 'Dành cho tài khoản có quyền LTD_GET_TEMPLATE. Trả đường dẫn tương đối tới file Excel mẫu. Sheet LichTiepDan đứng đầu và gồm 9 cột: Ngày tiếp dân, Từ, Đến, Mã quầy, Tài khoản cán bộ, Họ tên cán bộ, Sức chứa / ca, Địa điểm, Ghi chú. Sheet Hướng dẫn mô tả quy tắc phân công cán bộ–quầy, ca một tiếng và quyền RR_APPROVE.',
            responses: {
                200: {
                    description: 'Lấy đường dẫn file Excel mẫu thành công',
                    content: {
                        'application/json': {
                            schema: ReceptionScheduleManagementSchemas.TemplateSuccessSchema,
                        },
                    },
                },
                401: { description: 'Thiếu hoặc sai access token' },
                403: { description: 'Không có quyền LTD_GET_TEMPLATE' },
                500: { description: 'File Excel mẫu không tồn tại trên máy chủ' },
            }
        },
    },
}

const managementScheduleDemo = {
    id: '123e4567-e89b-42d3-a456-426614174000',
    ten_can_bo: 'Nguyễn Văn An',
    dia_diem: 'Bộ phận tiếp công dân',
    ngay_tiep_dan: '2026-08-26',
    thoi_gian: '07:30 - 16:30',
    ghi_chu: 'Tiếp công dân định kỳ',
    is_active: true,
    is_delete: false,
};

const managementScheduleWithSlotsDemo = {
    ...managementScheduleDemo,
    slots: [{
        timeSlot: '07:30 - 08:30',
        totalCapacity: 16,
        heldCount: 3,
        unassignedHeldCount: 1,
        remainingCapacity: 13,
        isFull: false,
        counters: [{
            id: '223e4567-e89b-42d3-a456-426614174000',
            counterCode: 'QUAY_1',
            capacity: 2,
            heldCount: 1,
            remainingCapacity: 1,
            isFull: false,
            isActive: true,
        }],
    }],
};

applyReceptionDemoExamples(ReceptionScheduleManagementSwagger, {
    'POST /api/reception-schedules/management/import': {
        responses: {
            200: successDemo('Import lịch tiếp dân thành công', {
                assignmentMode: 'RANDOM',
                assignmentScope: 'SESSION',
                overwriteApplied: true,
                overwrittenCount: 1,
                importedCount: 1,
                importedRowCount: 8,
                generatedAssignmentRowCount: 16,
                totalCounterSlots: 32,
                totalAssignments: 32,
                dateFrom: '2099-08-25',
                dateTo: '2099-08-25',
                importedDates: ['2099-08-25'],
                importedRows: [{
                    rowNumber: 2,
                    receptionDate: '2099-08-25',
                    startTime: '07:30',
                    endTime: '11:30',
                    counterCode: 'QUAY_1',
                    counterName: 'Quầy số 1',
                    officerUsername: 'canbo',
                    officerFullName: 'Nguyễn Văn An',
                    capacity: 2,
                    location: 'Bộ phận tiếp công dân',
                    note: 'Lịch định kỳ',
                }],
            }),
            400: errorDemo(
                'Demo 400 - File có dòng không hợp lệ',
                'Dữ liệu trong file không hợp lệ',
                [{ field: 'row 3', message: 'Thời gian kết thúc phải sau thời gian bắt đầu' }]
            ),
            409: errorDemo(
                'Demo 409 - Lịch trong file bị trùng',
                'Quầy QUAY_1 đã có cán bộ trực trong ca 07:30 - 08:30'
            ),
        },
    },
    'GET /api/reception-schedules/management': {
        parameters: { weekYear: null, monthYear: '8/2099', date: null, isActive: true },
        responses: {
            200: successDemo('Lấy danh sách lịch tiếp dân thành công', [managementScheduleDemo]),
            400: errorDemo(
                'Demo 400 - Dùng nhiều bộ lọc thời gian',
                'Dữ liệu không hợp lệ',
                [{ field: '', message: 'Chỉ được dùng một trong các bộ lọc weekYear, monthYear hoặc date' }]
            ),
        },
    },
    'POST /api/reception-schedules/management': {
        request: {
            defaultWorkingHours: {
                summary: 'Demo DEV hợp lệ - tạo lịch với giờ mặc định',
                value: {
                    tenCanBo: DEMO.createScheduleOfficer,
                    diaDiem: 'Bộ phận tiếp công dân',
                    ngayTiepDan: DEMO.dates.create,
                    ghiChu: 'Lịch được tạo khi chạy thử Swagger',
                },
            },
        },
        responses: {
            200: successDemo('Tạo lịch tiếp dân thành công', managementScheduleWithSlotsDemo),
            400: {
                invalidTime: errorDemo(
                    'Demo 400 - Khoảng thời gian không hợp lệ',
                    'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc'
                ),
                duplicateSchedule: errorDemo(
                    'Demo 400 - Lịch cán bộ bị trùng',
                    'Lịch tiếp dân của cán bộ vào ngày này đã tồn tại'
                ),
            },
        },
    },
    'GET /api/reception-schedules/management/pagination': {
        parameters: { weekYear: null, monthYear: '8/2099', date: null, page: 1, size: 10, isActive: true },
        responses: {
            200: successDemo(
                'Lấy danh sách lịch tiếp dân có phân trang thành công',
                [managementScheduleDemo],
                { currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 1 }
            ),
            400: errorDemo(
                'Demo 400 - Kích thước trang vượt giới hạn',
                'Dữ liệu không hợp lệ',
                [{ field: 'size', message: 'Kích thước trang không được vượt quá 100' }]
            ),
        },
    },
    'GET /api/reception-schedules/management/count': {
        parameters: { weekYear: null, monthYear: '8/2099', date: null },
        responses: {
            200: successDemo('Đếm lịch tiếp dân thành công', {
                total: 12,
                active: 9,
                inactive: 3,
            }),
        },
    },
    'DELETE /api/reception-schedules/management/{id}': {
        parameters: { id: DEMO.schedules.deletion },
        responses: {
            200: successDemo('Xóa lịch tiếp dân thành công', null),
            409: {
                activeSchedule: errorDemo(
                    'Demo 409 - Lịch vẫn đang hoạt động',
                    'Chỉ được xóa lịch đã ngừng hoạt động'
                ),
                heldRegistration: errorDemo(
                    'Demo 409 - Lịch đã có người giữ chỗ',
                    'Không thể xóa lịch tiếp dân đã có đăng ký giữ chỗ'
                ),
            },
        },
    },
    'GET /api/reception-schedules/management/{id}': {
        parameters: { id: DEMO.schedules.main },
        responses: {
            200: successDemo('Lấy chi tiết lịch tiếp dân thành công', managementScheduleWithSlotsDemo),
            404: errorDemo(
                'Demo 404 - ID lịch không tồn tại',
                'Lịch tiếp dân không tồn tại'
            ),
        },
    },
    'PUT /api/reception-schedules/management/{id}': {
        parameters: { id: DEMO.schedules.update },
        request: {
            updateMetadata: {
                summary: 'Demo hợp lệ - chỉ cập nhật thông tin mô tả',
                value: {
                    tenCanBo: 'Cán bộ Swagger đã cập nhật',
                    diaDiem: 'Bộ phận tiếp công dân',
                    ngayTiepDan: DEMO.dates.update,
                    ghiChu: 'Lịch đã được lãnh đạo điều chỉnh',
                },
            },
            updateWorkingPeriods: {
                summary: 'Demo hợp lệ - cập nhật hai khoảng làm việc',
                value: {
                    tenCanBo: 'Cán bộ Swagger cập nhật',
                    diaDiem: 'Bộ phận tiếp công dân',
                    ngayTiepDan: DEMO.dates.update,
                    workingPeriods: [
                        { startTime: '07:30', endTime: '11:30' },
                        { startTime: '13:30', endTime: '16:30' },
                    ],
                },
            },
            invalidSingleBoundary: {
                summary: 'Demo lỗi 400 - chỉ gửi một mốc thời gian',
                value: { batDau: '07:30' },
            },
        },
        responses: {
            200: successDemo('Cập nhật lịch tiếp dân thành công', managementScheduleWithSlotsDemo),
            400: errorDemo(
                'Demo 400 - Lịch đã có đăng ký giữ chỗ',
                'Không được thay đổi ngày hoặc thời gian khi lịch đã có đăng ký giữ chỗ'
            ),
        },
    },
    'PUT /api/reception-schedules/management/{id}/status': {
        parameters: { id: DEMO.schedules.status },
        request: {
            activateSchedule: {
                summary: 'Demo hợp lệ - bật lịch',
                value: { isActive: true },
            },
            deactivateSchedule: {
                summary: 'Demo hợp lệ - ngừng lịch chưa có đăng ký',
                value: { isActive: false },
            },
            missingStatus: {
                summary: 'Demo lỗi 400 - thiếu trạng thái',
                value: {},
            },
        },
        responses: {
            200: successDemo('Cập nhật trạng thái lịch tiếp dân thành công', {
                ...managementScheduleDemo,
                is_active: false,
            }),
            409: errorDemo(
                'Demo 409 - Lịch đã có người giữ chỗ',
                'Không thể ngừng lịch tiếp dân đã có đăng ký giữ chỗ'
            ),
        },
    },
    'GET /api/reception-schedules/management/template': {
        responses: {
            200: successDemo('Lấy template lịch tiếp dân thành công', {
                relative_url: '/static/template-lich-tiep-dan.xlsx',
            }),
            500: errorDemo(
                'Demo 500 - File mẫu không tồn tại',
                'File Excel mẫu không tồn tại trên máy chủ'
            ),
        },
    },
});

export default ReceptionScheduleManagementSwagger;
