import { z } from "zod";
import { emailSchema, nameSchema, objectIdSchema, phoneSchema } from "./common";

export const addToCartSchema = z.object({
  variantId: objectIdSchema,
  qty: z.coerce.number().int().min(1, "Choose at least 1.").max(10, "You can order up to 10 of one item."),
});

export const updateQtySchema = z.object({
  variantId: objectIdSchema,
  qty: z.coerce.number().int().min(0).max(10, "You can order up to 10 of one item."),
});

export const leadSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
});

export type LeadFormInput = z.input<typeof leadSchema>;
