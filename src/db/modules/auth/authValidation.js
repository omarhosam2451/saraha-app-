import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
    {
      message:
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character",
    }
  ),
});

export const registerSchema = loginSchema.extend({
  firstName: z
    .string()
    .min(3, {
      message: "First name must be at least 3 characters",
    })
    .max(8, {
      message: "First name must be at most 8 characters",
    }),
  lastName: z
    .string()
    .min(3, {
      message: "Last name must be at least 3 characters",
    })
    .max(8, {
      message: "Last name must be at most 8 characters",
    }),
  gender: z
    .enum(["male", "female"], {
      message: "Gender must be either male or female",
    })
    .default("male"),
  age: z
    .number()
    .min(16, {
      message: "Age must be at least 16",
    })
    .max(60, {
      message: "Age must be at most 60",
    })
    .optional(),
  profileImage: z.string().url().optional(),
  phoneNumber: z
    .string()
    .regex(/^(002|\+2)?01[0125][0-9]{8}$/, {
      message: "Please enter a valid Egyptian phone number",
    })
    .optional(),
  confirmPassword: z.string().regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
    {
      message:
        "Confirm password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character",
    }
  ),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "The password and confirm password do not match",
    path: ["confirmPassword"],
  }
);

    
export const regiesterSchema = registerSchema;

export const verifyOtpSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  otp: z.string().length(6, {
    message: "OTP must be exactly 6 digits",
  }).regex(/^\d{6}$/, {
    message: "OTP must contain only digits",
  }),
});