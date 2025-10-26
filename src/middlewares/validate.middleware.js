import { BaseError } from "../utils/base-error.util.js";

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            // gom lỗi chi tiết
            const details = error.details.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

            // tạo BaseError để errorResponse xử lý
            throw new BaseError(400, "Dữ liệu không hợp lệ", details);
        }

        req.body = value;
        next();
    };
};

export default validate;