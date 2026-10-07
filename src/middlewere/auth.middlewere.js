import envConfig from "../config/env.config.js";
import HttpAppError from "../uitilties/error/app-error.js";
import { verifyToken } from "../uitilties/token.utils.js";
import UserRepository from "../db/repositories/user.repository.js";

const userRepo = new UserRepository();

export const authanticate = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        throw new HttpAppError("Authorization header is missing", 401, {}, "UNAUTHORIZED");
    }

    const token = authorization.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : authorization.trim();

    if (!token) {
        throw new HttpAppError("Authorization token is missing", 401, {}, "UNAUTHORIZED");
    }

    let decodedToken;
    try {
        decodedToken = verifyToken(token, envConfig.user.jwtSecret);
    } catch (error) {
        throw new HttpAppError("Invalid authorization token", 401, {}, "UNAUTHORIZED");
    }

    const user = await userRepo.findOneDocument({ _id: decodedToken._id });

    if (!user) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND");
    }

    req.authUser = user;
    next();
};

export const authenticate = authanticate;

// export const authorize = (roles) => {
//         return (req, res, next) => {

//         }
// }