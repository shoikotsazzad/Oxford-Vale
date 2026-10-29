import { z } from "zod";
import { emailSchema, nameSchema, normalizePhone } from "./common";
import { isValidPhone } from "@/lib/phone";

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => v === "" || isValidPhone(v), "Enter a valid phone number (e.g. 07700 900123) or leave it empty."),
  subject: z.string().trim().max(120, "Subject is too long.").default(""),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(2000, "Message is too long (2000 characters max)."),
  // Honeypot: real users never fill this.
  website: z.string().max(0).optional().default(""),
});

export type ContactInput = z.input<typeof contactSchema>;
