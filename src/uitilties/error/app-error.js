class HttpAppError extends Error {
    message;
    statusCode;
    data;
    code;
    constructor(
        message,
        statusCode = 400,
        data = {},
        code = "BAD_REQUEST"
    ) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.data = data;
        this.code = code;
    }
}

export class BadRequestException extends HttpAppError {
    constructor(message, data = null, code = "BAD_REQUEST") {
        super(message, 400, data, code);
    }
}

export default HttpAppError;