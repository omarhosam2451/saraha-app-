import UserRepository from "../db/repositories/user.repository.js"
import { BadRequestException } from "../Common/Utils/Errors/exceptions.error.js"
import { decodeToken } from "../Common/Utils/token.utils.js"
import { tokenTypeEnum } from "../Common/constants.js"

const userRepo = new UserRepository()

export const authenticate = async (req, res, next) => {

    const { authorization } = req.headers
    if (!authorization) {
        throw new BadRequestException('Authorization header is missing', null, 'UNAUTHORIZED')
    }

    const [prefix, token] = authorization.split(' ')
    if (prefix !== 'Bearer' || !token) {
        throw new BadRequestException('Invalid authorization header format', null, 'UNAUTHORIZED')
    }

    const { user, accessTokenData } = await decodeToken({ token, tokenType: tokenTypeEnum.ACCESS_TOKEN })

    req.authUser = user
    req.accessTokenData = accessTokenData

    next()
}

export const authanticate = authenticate
