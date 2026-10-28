import { z } from "zod";
import { emailSchema, nameSchema, normalizePhone, BD_PHONE } from "./common";

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => v === "" || BD_PHONE.test(v), "Enter a valid Bangladeshi mobile number (01XXXXXXXXX) or leave it empty."),
  subject: z.string().trim().max(120, "Subject is too long.").default(""),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(2000, "Message is too long (2000 characters max)."),
  // Honeypot: real users never fill this.
  website: z.string().max(0).optional().default(""),
});

export type ContactInput = z.input<typeof contactSchema>;
