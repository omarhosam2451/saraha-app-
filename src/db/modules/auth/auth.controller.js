import { Router } from "express";
import * as authService from "./auth.service.js";
import { loginSchema, registerSchema } from "./authValidation.js";
import { validation } from "../../../middlewere/validation.middlewere.js";

const authController = Router();

authController.get("/", (req, res) => {
  res.status(200).json({ message: "Hello from auth controller!" });
});

const registerHandler = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.validate);
    res.status(201).json({ message: "User registered successfully", user: result });
  } catch (error) {
    next(error);
  }
};

authController.post("/register", validation(registerSchema), registerHandler);
authController.post("/signup", validation(registerSchema), registerHandler);

const loginHandler = async (req, res, next) => {
  try {
    const { email, password } = req.validate;
    const result = await authService.signIn({ email, password });
    res.status(200).json({ message: "User signed in successfully", user: result });
  } catch (error) {
    next(error);
  }
};

authController.post("/login", validation(loginSchema), loginHandler);
authController.post("/signin", validation(loginSchema), loginHandler);

authController.get("/getUserById/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await authService.getProfileById(userId);
    res.status(200).json({ message: "User found successfully", user: result });
  } catch (error) {
    next(error);
  }
});

export default authController;  