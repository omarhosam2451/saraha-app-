import { encrypt, hashEmail, decrypt } from "../../../uitilties/security/encription.security.js";
import User from "../../models/User.model.js";
import UserRepository from "../../repositories/user.repository.js";
import { hash, compareTwoHashes } from "../../../uitilties/security/hash.security.js";
import HttpAppError from "../../../uitilties/error/app-error.js";
import { generateToken, generateTokenPair, verifyRefreshToken, decodeToken, calculateTTL } from "../../../uitilties/token.utils.js";
import envConfig, { userEnvConfig } from "../../../config/env.config.js";
import {OAuth2Client} from 'google-auth-library'
import { providersEnum, tokenTypeEnum } from "../../../uitilties/enums.js";
import crypto from "node:crypto";
import { redisClient } from  "../../../common/redis.clients.js";
import { set, get, del, ttl } from "../../../common/services/redis.service.js";
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from "../../../common/services/email.service.js";

    const userRepo = new UserRepository()

const generateOtp = () => {
    return crypto.randomInt(100000, 999999).toString();
};

export       const registerUser = async (body) => {
    const { firstName, lastName, email, password, gender, age, profileImage, phoneNumber } = body;
    const normalizedEmail = email.trim().toLowerCase();
    const emailLookupHash = hashEmail(normalizedEmail);
    const isUserExist = await userRepo.findUserByEmailHash(emailLookupHash)
    if (isUserExist) {
        throw new HttpAppError("email already exists", 409, { duplicateEmail: email }, "email conflict ")
    }
    const encryptedEmail = encrypt(normalizedEmail);
    const hashedPassword = await hash(password);
    const user = await User.create({ firstName, lastName, email: encryptedEmail, emailLookupHash, password: hashedPassword, gender, age, profileImage, phoneNumber });

    const otp = generateOtp();
    const hashedOtp = await hash(otp);
    await set({
        key: `otp_${emailLookupHash}`,
        value: hashedOtp,
        options: { EX: 600 } 
    });

    await set({
        key: `email_verificaton:${normalizedEmail}`,
        value: hashedOtp,
        options: { EX: 600 } 
    });

    await sendEmail({
        to: normalizedEmail,
        subject: "Verify Your Email - Saraha App",
        message: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
                <h2 style="color: #1f2937; text-align: center;">Email Verification</h2>
                <p style="color: #4b5563; text-align: center;">Welcome to Saraha App! Use the OTP below to verify your email address.</p>
                <div style="background: #4f46e5; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 8px; margin: 24px 0;">
                    ${otp}
                </div>
                <p style="color: #6b7280; text-align: center; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
                <p style="color: #9ca3af; text-align: center; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
            </div>
        `,
    });

    return user;
};

export const verifyOtp = async ({ email, otp }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailLookupHash = hashEmail(normalizedEmail);

    const storedHashedOtp = await get(`otp_${emailLookupHash}`);
    if (!storedHashedOtp) {
        throw new HttpAppError("OTP has expired or was never generated. Please register again.", 400, {}, "OTP_EXPIRED");
    }

    const isOtpValid = await compareTwoHashes(storedHashedOtp, otp);
    if (!isOtpValid) {
        throw new HttpAppError("Invalid OTP. Please try again.", 400, {}, "INVALID_OTP");
    }

    await del(`otp_${emailLookupHash}`);

    const user = await User.findOneAndUpdate(
        { emailLookupHash },
        { isEmailVerified: true, isVerified: true },
        { new: true }
    );

    if (!user) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND");
    }

    return user;
};

const MAX_LOGIN_ATTEMPTS = 5;
const BAN_DURATION_SECONDS = 5 * 60;
const ATTEMPT_WINDOW_SECONDS = 10 * 60; 

export const signIn = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = hashEmail(normalizedEmail);

    const banKey      = `login_ban:${emailHash}`;
    const attemptKey  = `login_attempts:${emailHash}`;

    const bannedUntil = await get(banKey);
    if (bannedUntil) {
        const secondsLeft = await ttl(banKey);
        const minutesLeft = Math.ceil(secondsLeft / 60);
        throw new HttpAppError(
            `Too many failed login attempts. Your account is temporarily locked. Please try again in ${minutesLeft} minute(s).`,
            429,
            { retryAfterSeconds: secondsLeft > 0 ? secondsLeft : BAN_DURATION_SECONDS },
            "ACCOUNT_TEMPORARILY_BANNED"
        );
    }

    const isEmailExist = await User.findOne({ emailLookupHash: emailHash });
    if (!isEmailExist) {

        throw new HttpAppError("invalid email or password", 400, { email });
    }

    const isPasswordMatch = await compareTwoHashes(isEmailExist.password, password);
    if (!isPasswordMatch) {

        const currentAttempts = await get(attemptKey);
        const newAttempts = currentAttempts ? parseInt(currentAttempts, 10) + 1 : 1;

        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {

            await set({ key: banKey, value: "banned", expireTime: BAN_DURATION_SECONDS });
            await del(attemptKey);
            throw new HttpAppError(
                `Too many failed login attempts. Your account has been locked for ${BAN_DURATION_SECONDS / 60} minutes.`,
                429,
                { retryAfterSeconds: BAN_DURATION_SECONDS },
                "ACCOUNT_TEMPORARILY_BANNED"
            );
        }

        await set({ key: attemptKey, value: String(newAttempts), expireTime: ATTEMPT_WINDOW_SECONDS });

        const attemptsLeft = MAX_LOGIN_ATTEMPTS - newAttempts;
        throw new HttpAppError(
            `Invalid email or password. ${attemptsLeft} attempt(s) remaining before your account is temporarily locked.`,
            401,
            { email, attemptsLeft, reason: "wrong password" },
            "INVALID_CREDENTIALS"
        );
    }

    await del(attemptKey);
    await del(banKey); 

    if (isEmailExist.isTwoFactorEnabled) {
        const otp = generateOtp();
        const hashedOtp = await hash(otp);
        await set({
            key: `2fa_login:${emailHash}`,
            value: hashedOtp,
            expireTime: 5 * 60, 
        });

        await sendEmail({
            to: normalizedEmail,
            subject: "Your Login Verification Code - Saraha App",
            message: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
                    <h2 style="color: #1f2937; text-align: center;">Two-Factor Authentication</h2>
                    <p style="color: #4b5563; text-align: center;">A login attempt was detected. Use the code below to complete your sign-in.</p>
                    <div style="background: #4f46e5; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        ${otp}
                    </div>
                    <p style="color: #6b7280; text-align: center; font-size: 14px;">This code expires in <strong>5 minutes</strong>.</p>
                    <p style="color: #9ca3af; text-align: center; font-size: 12px;">If you didn't attempt to log in, please change your password immediately.</p>
                </div>
            `,
        });

        return {
            message: "A verification code has been sent to your email. Please verify to complete login.",
            twoFactorRequired: true,
        };
    }

    const accessToken = generateToken(
        { _id: isEmailExist._id, email: isEmailExist.email, role: isEmailExist.role },
        userEnvConfig.access_token_secret,
        { expiresIn: userEnvConfig.access_token_expires_in, jwtid: uuidv4() }
    );

    const refreshToken = generateToken(
        { _id: isEmailExist._id, email: isEmailExist.email, role: isEmailExist.role },
        userEnvConfig.refresh_token_secret,
        { expiresIn: userEnvConfig.refresh_token_expires_in, jwtid: uuidv4() }
    );

    return { message: 'Login successful', accessToken, refreshToken };
};

export const refreshToken = async (userRefreshToken) => {
    const decoded = await decodeToken({ token: userRefreshToken, tokenType: tokenTypeEnum.REFRESH_TOKEN });
    const user = await User.findById(decoded?._id);
    if (!user) {
        throw new HttpAppError("User not found", 404);
    }
    const accessToken = generateToken(
        { _id: user._id, email: user.email, role: user.role },
        userEnvConfig.access_token_secret,
        { expiresIn: userEnvConfig.access_token_expires_in, jwtid: uuidv4() }
    );
    return { message: 'Token refreshed successfully', accessToken };
};

export const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new HttpAppError("Refresh token is required", 400, {}, "MISSING_REFRESH_TOKEN");
    }

    let decoded;
    try {
        const jwt = (await import("jsonwebtoken")).default;
        decoded = jwt.decode(refreshToken);
    } catch {
        throw new HttpAppError("Malformed refresh token", 401, {}, "INVALID_REFRESH_TOKEN");
    }

    if (!decoded || !decoded.role) {
        throw new HttpAppError("Invalid refresh token", 401, {}, "INVALID_REFRESH_TOKEN");
    }

    if (decoded.tokenType !== "refresh") {
        throw new HttpAppError("Token is not a refresh token", 401, {}, "INVALID_TOKEN_TYPE");
    }

    let verifiedPayload;
    try {
        verifiedPayload = verifyRefreshToken(refreshToken, decoded.role);
    } catch {
        throw new HttpAppError("Refresh token is invalid or expired", 401, {}, "EXPIRED_REFRESH_TOKEN");
    }

    const user = await User.findById(verifiedPayload._id);
    if (!user) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND");
    }

    if (!user.isActive) {
        throw new HttpAppError("Account is deactivated", 403, {}, "ACCOUNT_DEACTIVATED");
    }

    const tokens = generateTokenPair({
        _id: user._id,
        email: user.email,
        role: user.role
    });

    return tokens;
};

export const getProfileById = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new HttpAppError("User not found", 404);
    }
    return user;
};

export const googleSignUp = async (idToken) => {

    return true
}
export const googleRegister = async (token) => {
    const googleTokenPayload = await verifyIdToken(token);
    if (!googleTokenPayload?.email_verified || !googleTokenPayload.sub || !googleTokenPayload.email) {
        throw new HttpAppError("Invalid Google token or email not verified", 400, {}, "INVALID_GOOGLE_TOKEN");
    }

    let user = await User.findOne({ googleSub: googleTokenPayload.sub });

    user = await updateOrCreateUser(user, googleTokenPayload);

    const { accessToken, refreshToken } = generateTokenPair({
        _id: user._id,
        email: user.email,
        role: user.role,
    });

    return { accessToken, refreshToken };
}

const updateOrCreateUser = async (user ,  googleTokenPayload) => {
    const { sub, email, given_name, family_name } = googleTokenPayload;
    const normalizedEmail = email.trim().toLowerCase();
    const firstName = given_name?.trim();
    const lastName = family_name?.trim();

    if (user) {
        const updates = {
            googleSub: sub,
            provider: providersEnum.GOOGLE,
            email: encrypt(normalizedEmail),
            emailLookupHash: hashEmail(normalizedEmail),
        };
        if (firstName && firstName.length >= 3) updates.firstName = firstName;
        if (lastName && lastName.length >= 3) updates.lastName = lastName;

        return User.findByIdAndUpdate(user._id, updates, { new: true, runValidators: true });
    }

    const hashedPassword = crypto.randomBytes(16).toString("hex");
    return User.create({
        googleSub: sub,
        provider: providersEnum.GOOGLE,
        firstName: firstName && firstName.length >= 3 ? firstName : "Google",
        lastName: lastName && lastName.length >= 3 ? lastName : "User",
        email: encrypt(normalizedEmail),
        emailLookupHash: hashEmail(normalizedEmail),
        password: hashedPassword,
    });
}

const verifyIdToken = async (token) => {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: envConfig.GCP.clientId
    });
    const payload = ticket.getPayload();
    return payload;
}

export const logout = async (accessTokenData, refreshTokenData) => {
    const { exp: accessExpiration, jti: accessId } = accessTokenData
    const { exp: refreshExpiration, jti: refreshId } = refreshTokenData

    const accessTTL = calculateTTL(accessExpiration)
    const refreshTTL = calculateTTL(refreshExpiration)

    await Promise.all([
        set({ key: `bl_access_${accessId}`, value: true, options: { EX: accessTTL } }),
        set({ key: `bl_refresh_${refreshId}`, value: true, options: { EX: refreshTTL } })
    ])

    return { accessTTL, refreshTTL }
} 
export const logOut = logout

export const enableTwoFactor = async (userId) => {
    const user = await User.findById(userId).select("+emailLookupHash");
    if (!user) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND");
    }
    if (user.isTwoFactorEnabled) {
        throw new HttpAppError("Two-factor authentication is already enabled on your account.", 400, {}, "2FA_ALREADY_ENABLED");
    }

    const emailHash = user.emailLookupHash;
    const plainEmail = decrypt(user.email);

    const otp = generateOtp();
    const hashedOtp = await hash(otp);
    await set({
        key: `2fa_enable:${emailHash}`,
        value: hashedOtp,
        expireTime: 10 * 60, 
    });

    await sendEmail({
        to: plainEmail,
        subject: "Enable Two-Factor Authentication - Saraha App",
        message: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
                <h2 style="color: #1f2937; text-align: center;">Enable Two-Factor Authentication</h2>
                <p style="color: #4b5563; text-align: center;">Use the code below to activate 2FA on your Saraha account.</p>
                <div style="background: #059669; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 8px; margin: 24px 0;">
                    ${otp}
                </div>
                <p style="color: #6b7280; text-align: center; font-size: 14px;">This code expires in <strong>10 minutes</strong>.</p>
                <p style="color: #9ca3af; text-align: center; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `,
    });

    return { message: "A verification code has been sent to your email. Submit it to /2fa/verify to enable two-factor authentication." };
};

export const verifyAndEnableTwoFactor = async (userId, otp) => {
    const userWithHash = await User.findById(userId).select("+emailLookupHash");
    if (!userWithHash) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND");
    }
    if (userWithHash.isTwoFactorEnabled) {
        throw new HttpAppError("Two-factor authentication is already enabled.", 400, {}, "2FA_ALREADY_ENABLED");
    }

    const emailHash = userWithHash.emailLookupHash;
    const storedHash = await get(`2fa_enable:${emailHash}`);
    if (!storedHash) {
        throw new HttpAppError("Verification code has expired or was never generated. Please request a new one.", 400, {}, "OTP_EXPIRED");
    }

    const isValid = await compareTwoHashes(storedHash, otp);
    if (!isValid) {
        throw new HttpAppError("Invalid verification code. Please try again.", 400, {}, "INVALID_OTP");
    }

    await del(`2fa_enable:${emailHash}`);

    await User.findByIdAndUpdate(userId, { isTwoFactorEnabled: true });

    return { message: "Two-factor authentication has been successfully enabled on your account." };
};

export const verifyTwoFactorLogin = async ({ email, otp }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailHash = hashEmail(normalizedEmail);

    const storedHash = await get(`2fa_login:${emailHash}`);
    if (!storedHash) {
        throw new HttpAppError(
            "Verification code has expired or was never generated. Please log in again.",
            400,
            {},
            "OTP_EXPIRED"
        );
    }

    const isValid = await compareTwoHashes(storedHash, otp);
    if (!isValid) {
        throw new HttpAppError("Invalid verification code. Please try again.", 400, {}, "INVALID_OTP");
    }

    await del(`2fa_login:${emailHash}`);

    const user = await User.findOne({ emailLookupHash: emailHash });
    if (!user) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND");
    }

    const accessToken = generateToken(
        { _id: user._id, email: user.email, role: user.role },
        userEnvConfig.access_token_secret,
        { expiresIn: userEnvConfig.access_token_expires_in, jwtid: uuidv4() }
    );

    const refreshToken = generateToken(
        { _id: user._id, email: user.email, role: user.role },
        userEnvConfig.refresh_token_secret,
        { expiresIn: userEnvConfig.refresh_token_expires_in, jwtid: uuidv4() }
    );

    return { message: "Login successful", accessToken, refreshToken };
};

export const confirmEmail = async (email, otp) => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailLookupHash = hashEmail(normalizedEmail);

    const hashedotp = await get(`email_verificaton:${normalizedEmail}`);
    if (!hashedotp) {
        throw new HttpAppError(
            "OTP has expired or was never generated. Please request a new one.",
            400,
            {},
            "OTP_EXPIRED"
        );
    }

    const isValidotp = await compareTwoHashes(hashedotp, otp);
    if (!isValidotp) {
        throw new HttpAppError(
            "Invalid OTP. Please try again.",
            400,
            {},
            "INVALID_OTP"
        );
    }

    const updatedUser = await userRepo.findAndUpdateDocument(
        { emailLookupHash },
        { isEmailVerified: true },
        { new: true }
    );

    if (!updatedUser) {
        throw new HttpAppError("User not found", 404, {}, "USER_NOT_FOUND");
    }

    await del(`email_verificaton:${normalizedEmail}`);

    return true;
};
