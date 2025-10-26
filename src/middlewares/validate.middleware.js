import { BaseError } from "../utils/base-error.util.js";

const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const dataToValidate = source === 'params' ? req.params : 
                               source === 'query' ? req.query : 
                               req.body;
        
        const { error, value } = schema.validate(dataToValidate, { abortEarly: false });
        if (error) {
            // gom lỗi chi tiết
            const details = error.details.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

            // tạo BaseError để errorResponse xử lý
            throw new BaseError(400, "Dữ liệu không hợp lệ", details);
        }

        // Cập nhật data vào đúng source
        if (source === 'params') {
            req.params = value;
        } else if (source === 'query') {
            req.query = value;
        } else {
            req.body = value;
        }
        next();
    };
};

export default validate;