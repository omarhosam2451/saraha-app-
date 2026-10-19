import { Router } from "express";
import * as authService from "./auth.service.js";
import { loginSchema, registerSchema, verifyOtpSchema } from "./authValidation.js";
import { validation } from "../../../middlewere/validation.middlewere.js";
import { authanticate, authorize } from "../../../middlewere/auth.middlewere.js";
import { decodeRefreshToken } from "../../../middlewere/decodeRefreshToken.middleware.js";
import HttpAppError from "../../../uitilties/error/app-error.js";

const authController = Router();

authController.get("/", (req, res) => {
    res.status(200).json({ message: "Hello from auth controller!" });
});


const registerHandler = async (req, res, next) => {
    try {
        const result = await authService.registerUser(req.validate);
        res.status(201).json({ message: "User registered successfully. An OTP has been sent to your email.", user: result });
    } catch (error) {
        next(error);
    }
};

authController.post("/register", validation(registerSchema), registerHandler);
authController.post("/signup",   validation(registerSchema), registerHandler);

authController.post("/verify-otp", validation(verifyOtpSchema), async (req, res, next) => {
    try {
        const { email, otp } = req.validate;
        const result = await authService.verifyOtp({ email, otp });
        res.status(200).json({ message: "Email verified successfully", user: result });
    } catch (error) {
        next(error);
    }
});

authController.post("/confirm-email", validation(verifyOtpSchema), async (req, res, next) => {
    try {
        const { email, otp } = req.validate;
        const result = await authService.confirmEmail(email, otp);
        res.status(200).json({ message: "Email confirmed successfully", success: result });
    } catch (error) {
        next(error);
    }
});

const loginHandler = async (req, res, next) => {
    try {
        const { email, password } = req.validate;
        const result = await authService.signIn({ email, password });
        res.status(200).json({ message: "User signed in successfully", ...result });
    } catch (error) {
        next(error);
    }
};

authController.post("/login",  validation(loginSchema), loginHandler);
authController.post("/signin", validation(loginSchema), loginHandler);

authController.post("/refresh-token", async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const tokens = await authService.refreshAccessToken(refreshToken);
        res.status(200).json({
            message: "Tokens refreshed successfully",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error) {
        throw new HttpAppError("something happend" , error)
    }
});


authController.get("/getUserById/:userId",authanticate,authorize(["admin"]), async (req, res, next) => {
        try {
            const { userId } = req.params;
            const result = await authService.getProfileById(userId);
            res.status(200).json({ message: "User found successfully", user: result });
        } catch (error) {
            next(error);
        }
    }
);

authController.post("/google-signin", async (req, res, next) => {
    const { token } = req.body;
    if(!token) {
        throw new HttpAppError("Token is required", 400);
    }
    const result = await authService.googleRegister(token);
    res.status(200).json({ message: "Google signin successful", data: result });
})


authController.post("/google-register", async (req, res, next) => { 
const{idToken} = req.body;
if(!idToken) {
    throw new HttpAppError("Id Token is required", 400);    
}
const result = await authService.googleSignUp(idToken);
res.status(200).json({ message: "Google signup successful",data: result });
}

)
authController.post("/logout", authanticate, decodeRefreshToken, async (req, res, next) => {
    try {
        const result = await authService.logout(req.accessTokenData, req.refreshTokenData);
        res.status(200).json({ message: "User logged out successfully", data: result });
    } catch (error) {
        next(error);
    }
});

export default authController;