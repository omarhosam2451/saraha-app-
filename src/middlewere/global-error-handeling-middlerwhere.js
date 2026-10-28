import multer from "multer";

const globalErrorHandler = (err, req, res, next) => {
    console.error(Object.keys(err), err);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            message: err.message,
            error: "MULTER_ERROR",
            field: err.field,
            data: {}
        });
    }

    const isInvalidJson = err.type === "entity.parse.failed";

    res.status(err.statusCode || err.status || 500).json({
        message: err.message || "Internal server error",
        error: isInvalidJson ? "INVALID_JSON" : err.code || "INTERNAL_SERVER_ERROR",
        data: err.data || {}
    });
};

export default globalErrorHandler;
