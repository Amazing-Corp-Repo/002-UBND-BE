import { convertBigInt } from "./number.util.js";

export const createPagination = (currentPage, pageSize, totalItems) => {
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
        currentPage,
        pageSize,
        totalPages,
        totalItems,
    };
};

export const successResponse = (res, data = {}, message = "Success", pagination = null, extra = null) => {
    const payload = {
        success: true,
        data,
        message,
        pagination,
    };
    if (extra && typeof extra === 'object') {
        Object.assign(payload, extra);
    }
    return res.json(convertBigInt(payload));
};

export const errorResponse = (res, error, statusCode = 500) => {
    return res.status(statusCode).json(convertBigInt({
        success: false,
        message: error.message || "Error occurred",
        errors: error.details || null,
    }));
};
