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

export function BadRequestException(message = "Bad request", data = null, code = "BAD_REQUEST") {
    const error = new HttpAppError(message, 400, data, code);
    if (!(this instanceof BadRequestException)) {
        throw error;
    }
    return error;
}
BadRequestException.prototype = Object.create(HttpAppError.prototype);
BadRequestException.prototype.constructor = BadRequestException;

export function NotFoundException(message = "Not found", data = null, code = "NOT_FOUND") {
    const error = new HttpAppError(message, 404, data, code);
    if (!(this instanceof NotFoundException)) {
        throw error;
    }
    return error;
}
NotFoundException.prototype = Object.create(HttpAppError.prototype);
NotFoundException.prototype.constructor = NotFoundException;

export default HttpAppError;