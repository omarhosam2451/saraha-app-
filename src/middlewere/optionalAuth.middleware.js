import enums from "../common/constants.js"
import { BadRequestException, NotFoundException } from "../common/Utils/Errors/exceptions.error.js"
import { verifyToken } from "../uitilties/token.utils.js"
import { compareTwoHashes } from "../uitilties/security/hash.security.js"
import User from "../db/models/User.model.js"
import message from "../db/models/message.model.js"

export const models = {
    userModel: User,
    messageModel: message
}

export const findOne = async ({ model, where = {}, select = "" } = {}) => {
    let filter = { ...where }
    if (where.email && model?.schema?.paths?.emailLookupHash) {
        try {
            const { hashEmail } = await import("../uitilties/security/encription.security.js")
            filter = {
                $or: [
                    { email: where.email },
                    { emailLookupHash: hashEmail(where.email) }
                ]
            }
        } catch {}
    }
    let query = model.findOne(filter)
    if (select) {
        query = query.select(select)
    }
    return await query
}

export const myCompare = async ({ plainText, hashedText } = {}) => {
    if (!plainText || !hashedText) return false
    if (plainText === hashedText) return true
    return await compareTwoHashes(hashedText, plainText)
}

export const optionalAuth = async (req, res, next) => {
    try {
        const { authorization } = req.headers
        if (!authorization) {
            return next()
        }

        const [rawPrefix, ...tokenParts] = authorization.trim().split(" ")
        const token = tokenParts.join(" ").trim()
        if (!rawPrefix || !token) {
            BadRequestException("invalid auth format")
        }

        let prefix = rawPrefix
        if (prefix?.toLowerCase() === "bearer") prefix = enums.authEnum.Bearer
        if (prefix?.toLowerCase() === "basic") prefix = enums.authEnum.Basic

        switch (prefix) {
            case enums.authEnum.Basic: {
                let data = Buffer.from(token, "base64").toString()
                let [email, password] = data.split(":")
                let user = await findOne({ model: models.userModel, where: { email } })
                let check = await myCompare({ plainText: password, hashedText: user?.password })
                if (!check) NotFoundException("user not found")
                req.user = user
                req.authUser = user
                next()
                break
            }
            case enums.authEnum.Bearer: {
                req.user = await verifyToken(token, enums.tokenTypesEnum.access)
                req.authUser = req.user
                next()
                break
            }
            default:
                BadRequestException("invalid auth type")
                break
        }
    } catch (error) {
        next(error)
    }
}

export default optionalAuth
