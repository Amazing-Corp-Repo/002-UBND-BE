const MauDonSwagger = {
    '/api/thu-tuc/{id}/mau-don': {
        get: {
            tags: ['MauDon'],
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
            responses: {}
        }
    }
};

export default MauDonSwagger;

