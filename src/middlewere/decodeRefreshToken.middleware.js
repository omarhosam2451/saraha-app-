import { BadRequestException } from "../Common/Utils/Errors/exceptions.error.js"
import { decodeToken } from "../Common/Utils/token.utils.js"
import { tokenTypeEnum } from "../Common/constants.js"

export const decodeRefreshToken = async (req, res, next) => {
    const { refreshtoken } = req.headers
    if (!refreshtoken) {
        throw new BadRequestException('refresh token header is missing', null, 'UNAUTHORIZED')
    }

    const [prefix, token] = refreshtoken.split(' ')
    if (prefix !== 'Bearer' || !token) {
        throw new BadRequestException('Invalid authorization header format', null, 'UNAUTHORIZED')
    }

    const {tokenData} = await decodeToken({ token, tokenType: tokenTypeEnum.REFRESH_TOKEN })

    req.refreshTokenData = tokenData
    next()
}
