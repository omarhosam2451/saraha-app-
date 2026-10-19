import HttpAppError from "../uitilties/error/app-error.js"

export const validation = (schema, source = "body") => {
    return (req, res, next) => {
        const input = req[source]
        const validationResult = schema.safeParse(input)
        if (!validationResult.success) {
            return next(
                new HttpAppError(
                    "Validation failed",
                    422,
                    validationResult.error.issues,
                    "VALIDATION_ERROR"
                )
            )
        }
        req.validate = { ...(req.validate || {}), ...validationResult.data }
        next()
    }
}