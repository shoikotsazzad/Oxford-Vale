import { z } from "zod";
import { emailSchema, nameSchema, phoneSchema } from "./common";

export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(100, "Password is too long.");

export const registerSchema = z.object({ name: nameSchema, email: emailSchema, phone: phoneSchema, password: passwordSchema });
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.").max(100) });
export const forgotSchema = z.object({ email: emailSchema });
export const resetSchema = z
  .object({ token: z.string().min(20).max(100), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match.", path: ["confirm"] });
export const profileSchema = z.object({ name: nameSchema, phone: phoneSchema });
