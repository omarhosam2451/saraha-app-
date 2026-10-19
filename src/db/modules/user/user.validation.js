import { z } from "zod";

export const updateProfileSchema = z.object({
    firstName: z
        .string()
        .min(3, { message: "First name must be at least 3 characters" })
        .max(20, { message: "First name must be at most 20 characters" })
        .optional(),
    lastName: z
        .string()
        .min(3, { message: "Last name must be at least 3 characters" })
        .max(20, { message: "Last name must be at most 20 characters" })
        .optional(),
    gender: z
        .enum(["male", "female"], { message: "Gender must be either male or female" })
        .optional(),
    age: z
        .number()
        .min(16, { message: "Age must be at least 16" })
        .max(100, { message: "Age must be at most 100" })
        .optional(),
    profileImage: z.string().url({ message: "Profile image must be a valid URL" }).optional(),
}).strict();

export const adminUpdateUserSchema = z.object({
    firstName: z
        .string()
        .min(3, { message: "First name must be at least 3 characters" })
        .max(20, { message: "First name must be at most 20 characters" })
        .optional(),
    lastName: z
        .string()
        .min(3, { message: "Last name must be at least 3 characters" })
        .max(20, { message: "Last name must be at most 20 characters" })
        .optional(),
    gender: z
        .enum(["male", "female"], { message: "Gender must be either male or female" })
        .optional(),
    age: z
        .number()
        .min(16, { message: "Age must be at least 16" })
        .max(100, { message: "Age must be at most 100" })
        .optional(),
    profileImage: z.string().url({ message: "Profile image must be a valid URL" }).optional(),
    role: z
        .enum(["user", "admin"], { message: "Role must be either user or admin" })
        .optional(),
    isVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
}).strict();

export const userIdParamSchema = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, { message: "Invalid user ID format" }),
});
