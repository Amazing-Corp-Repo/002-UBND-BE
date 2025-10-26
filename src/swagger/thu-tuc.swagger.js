const ThuTucSwagger = {
    '/api/thu-tuc/{id}/mau-don': {
        get: {
            tags: ['Thu tuc'],
            summary: 'Lấy danh sách mẫu đơn theo ID thủ tục',
            description: 'Lấy tất cả các mẫu đơn/biểu mẫu liên quan đến một thủ tục hành chính cụ thể',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    },
                    description: 'ID của thủ tục hành chính'
                }
            ],
            responses: {
                200: {
                    description: 'Lấy danh sách mẫu đơn thành công',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                id: {
                                                    type: 'string',
                                                    format: 'uuid',
                                                    description: 'ID của mẫu đơn'
                                                },
                                                ten_mau_don: {
                                                    type: 'string',
                                                    description: 'Tên mẫu đơn'
                                                },
                                                mo_ta: {
                                                    type: 'string',
                                                    description: 'Mô tả mẫu đơn'
                                                },
                                                url_file_pdf: {
                                                    type: 'string',
                                                    description: 'URL file PDF của mẫu đơn'
                                                },
                                                kich_thuoc_file_mb: {
                                                    type: 'number',
                                                    description: 'Kích thước file (MB)'
                                                },
                                                ghi_chu: {
                                                    type: 'string',
                                                    description: 'Ghi chú'
                                                },
                                                so_luong_ban_chinh: {
                                                    type: 'number',
                                                    description: 'Số lượng bản chính'
                                                },
                                                so_luong_ban_sao: {
                                                    type: 'number',
                                                    description: 'Số lượng bản sao'
                                                },
                                                thoi_gian_tao: {
                                                    type: 'string',
                                                    format: 'date-time',
                                                    description: 'Thời gian tạo'
                                                }
                                            }
                                        }
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Lấy danh sách mẫu đơn thành công'
                                    },
                                    statusCode: {
                                        type: 'number',
                                        example: 200
                                    }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Không tìm thấy thủ tục hành chính'
                },
                400: {
                    description: 'Dữ liệu không hợp lệ (ID không đúng format)'
                }
            }
        }
    }
};

export default ThuTucSwagger;
