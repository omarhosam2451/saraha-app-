import { encrypt, hashEmail } from "../../../uitilties/security/encription.security.js";
import User from "../../models/User.model.js";
import UserRepository from "../../repositories/user.repository.js";
import { hash, compareTwoHashes } from "../../../uitilties/security/hash.security.js";
import HttpAppError from "../../../uitilties/error/app-error.js";
import { generateToken } from "../../../uitilties/token.utils.js";
import envConfig from "../../../config/env.config.js";

const userRepo = new UserRepository()


export const registerUser = async (body) => {
    const { firstName, lastName, email, password, gender, age, profileImage, phoneNumber } = body;
    const normalizedEmail = email.trim().toLowerCase();
    const emailLookupHash = hashEmail(normalizedEmail);
    const isUserExist = await userRepo.findUserByEmailHash(emailLookupHash)
    if (isUserExist) {
        throw new HttpAppError("email already exists", 409, { duplicateEmail: email }, "email conflict ")
    }
    const encryptedEmail = encrypt(normalizedEmail);
    const hashedPassword = await hash(password);
    return await User.create({ firstName, lastName, email: encryptedEmail, emailLookupHash, password: hashedPassword, gender, age, profileImage, phoneNumber });
};




export const signIn = async ({ email, password }) => {
    const user = await User.findOne({ emailLookupHash: hashEmail(email) });

    if (!user) {
        throw new HttpAppError("invalid email or password", 400, { email });
    }

    const isPasswordMatch = await compareTwoHashes(user.password, password);
    if (!isPasswordMatch) {
        throw new HttpAppError("invalid email or password", 401, { email, reason: "wrong password" });
    }


    const accessToken = generateToken(
        {
            _id: user._id,
            email: user.email
        },
        envConfig.user.jwtSecret,
        { expiresIn: "1h" }
    );

    return {
        message: "Signed in successfully",
        accessToken
    };
};


export const getProfileById = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new HttpAppError("User not found", 404);
    }
    return user;
};



    