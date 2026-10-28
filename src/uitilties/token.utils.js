import jwt from "jsonwebtoken";
import envConfig, { userEnvConfig } from "../config/env.config.js";
import UserRepository from "../db/repositories/user.repository.js";
import { BadRequestException } from "./error/app-error.js";
import { tokenTypeEnum } from "./enums.js";
import { get } from "../common/services/redis.service.js";

const userRepo = new UserRepository();

export const calculateTTL = (expiration) => {
    return Math.max(0, Math.floor(expiration - Date.now() / 1000));
};

export const generateToken = (payload, secret, options) => {    
    return jwt.sign(payload, secret, options);
};

export const verifyToken = async (token, tokenTypeOrSecret) => {
    if (
        tokenTypeOrSecret === "access" ||
        tokenTypeOrSecret === "refresh" ||
        tokenTypeOrSecret === tokenTypeEnum.ACCESS_TOKEN ||
        tokenTypeOrSecret === tokenTypeEnum.REFRESH_TOKEN
    ) {
        const { user } = await decodeToken({
            token,
            tokenType: tokenTypeOrSecret === "refresh" || tokenTypeOrSecret === tokenTypeEnum.REFRESH_TOKEN
                ? tokenTypeEnum.REFRESH_TOKEN
                : tokenTypeEnum.ACCESS_TOKEN
        });
        return user;
    }
    return jwt.verify(token, tokenTypeOrSecret);
};

export const decodeToken = async ({ token, tokenType = tokenTypeEnum.ACCESS_TOKEN } = {}) => {
    if (!token) {
        throw new BadRequestException("Token is required", null, "UNAUTHORIZED");
    }

    let decodedPayload;
    try {
        decodedPayload = jwt.decode(token);
    } catch {
        throw new BadRequestException("Invalid token format", null, "UNAUTHORIZED");
    }

    if (!decodedPayload || !decodedPayload._id) {
        throw new BadRequestException("Invalid token payload", null, "UNAUTHORIZED");
    }

    const isAdmin = decodedPayload.role === "admin";
    let secret;
    if (tokenType === tokenTypeEnum.REFRESH_TOKEN) {
        secret = isAdmin ? envConfig.admin.jwtRefreshSecret : (userEnvConfig.refresh_token_secret || envConfig.user.jwtRefreshSecret);
    } else {
        secret = isAdmin ? envConfig.admin.jwtSecret : (userEnvConfig.access_token_secret || envConfig.user.jwtSecret);
    }

    let verifiedData;
    try {
        verifiedData = jwt.verify(token, secret);
    } catch (err) {
        throw new BadRequestException(err.message || "Invalid or expired token", null, "UNAUTHORIZED");
    }

    if (verifiedData?.jti) {
        const blacklistKey = tokenType === tokenTypeEnum.REFRESH_TOKEN
            ? `bl_refresh_${verifiedData.jti}`
            : `bl_access_${verifiedData.jti}`;
        const isRevoked = await get(blacklistKey) || await get(verifiedData.jti);
        if (isRevoked) {
            throw new BadRequestException("Token is revoked", null, "UNAUTHORIZED");
        }
    }

    const user = await userRepo.findDocumentById(verifiedData._id, "-password");
    if (!user) {
        throw new BadRequestException("User not found", null, "UNAUTHORIZED");
    }

    return { user, accessTokenData: verifiedData, tokenData: verifiedData };
};

export const generateTokenPair = (payload) => {
    const { role } = payload;

    const accessSecret = role === "admin"
        ? envConfig.admin.jwtSecret
        : envConfig.user.jwtSecret;

    const refreshSecret = role === "admin"
        ? envConfig.admin.jwtRefreshSecret
        : envConfig.user.jwtRefreshSecret;

    const accessToken = generateToken(
        { _id: payload._id, email: payload.email, role: payload.role },
        accessSecret,
        { expiresIn: envConfig.tokenExpiry.access }
    );

    const refreshToken = generateToken(
        { _id: payload._id, role: payload.role, tokenType: "refresh" },
        refreshSecret,
        { expiresIn: envConfig.tokenExpiry.refresh }
    );

    return { accessToken, refreshToken };
};
        
export const verifyRefreshToken = (token, role) => {
    const refreshSecret = role === "admin"
        ? envConfig.admin.jwtRefreshSecret
        : envConfig.user.jwtRefreshSecret;

    return jwt.verify(token, refreshSecret);
};