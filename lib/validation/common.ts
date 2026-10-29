import { z } from "zod";

import { isValidPhone, normalizePhone } from "@/lib/phone";

export { normalizePhone };

/** UK mobile or landline (07…, 020…, 0800…), or an international number starting with +. Stored normalised. */
export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine(isValidPhone, "Enter a valid phone number, e.g. 07700 900123 or 020 7946 0001 (or +country code).");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address."));
export const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email or leave it empty.");

export const nameSchema = z.string().trim().min(2, "Please enter your name.").max(80, "Name is too long.");
export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id.");
