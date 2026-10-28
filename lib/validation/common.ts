import { z } from "zod";

/** Bangladesh mobile: 01XXXXXXXXX (11 digits, operator 3–9). Accepts +88 / spaces / dashes and normalises. */
export const BD_PHONE = /^01[3-9]\d{8}$/;
export const normalizePhone = (v: string) => v.replace(/[\s-]/g, "").replace(/^\+?88(?=01)/, "");

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => BD_PHONE.test(v), "Enter a valid Bangladeshi mobile number (01XXXXXXXXX).");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));
export const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email or leave it empty.");

export const nameSchema = z.string().trim().min(2, "Please enter your name.").max(80, "Name is too long.");
export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id.");
