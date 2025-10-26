import Joi from 'joi';

// Schema không cần validation cho GET request vì chỉ lấy params
// Nhưng để tiện mở rộng sau này, tạo một schema cơ bản

export const GetMauDonByThuTucIdParams = Joi.object({
    id: Joi.string().uuid().required().messages({
        'string.uuid': 'ID không hợp lệ',
        'any.required': 'ID thủ tục là bắt buộc'
    })
});

export default {
    GetMauDonByThuTucIdParams
};
