const globalErrorHandler = (err, req, res, next) => {

    console.error(Object.keys(err), err);

    const isInvalidJson = err.type === "entity.parse.failed";

    res.status(err.statusCode || err.status || 500).json({
        message: err.message || "Internal server error",
        error: isInvalidJson ? "INVALID_JSON" : err.code || "INTERNAL_SERVER_ERROR",
        data: err.data || {}
    });
};
export default globalErrorHandler;