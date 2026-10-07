import HttpAppError from "../uitilties/error/app-error.js"

export const validation = (schema)=>{
    return (req , res , next)=>{
        const validationResult = schema.safeParse(req.body)
        if (!validationResult.success) {
            throw new HttpAppError(
                "Invalid request body",
                402,
                validationResult.error.issues,
                "VALIDATION_ERROR"
            )
        }
        req.validate = validationResult.data
        next()
    }
}