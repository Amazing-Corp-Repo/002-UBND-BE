export const createPagination = (currentPage, pageSize, totalItems) => {
    const totalPages = Math.ceil(totalItems / pageSize);

    return {
        currentPage,
        pageSize,
        totalPages,
        totalItems,
    };
};

export const successResponse = (res, data = {}, message = "Success", pagination = null) => {
    return res.json({
        success: true,
        data,
        message,
        pagination,
    });
};

export const errorResponse = (res, error, statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message: error.message || "Error occurred",
        errors: error.details || null,
    });
};
