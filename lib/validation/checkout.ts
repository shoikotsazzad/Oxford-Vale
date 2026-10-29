import { z } from "zod";
import { emailSchema, nameSchema, phoneSchema } from "./common";
import { addressSchema } from "./address";
import { passwordSchema } from "./auth";
import { PAYMENT_METHODS } from "@/models/enums";

export const checkoutSchema = z
  .object({
    contact: z.object({ name: nameSchema, phone: phoneSchema, email: emailSchema }),
    address: addressSchema,
    deliveryOption: z.string().regex(/^[a-f0-9]{24}$/i, "Choose a delivery option."),
    paymentMethod: z.enum(PAYMENT_METHODS, "Choose a payment method."),
    couponCode: z.string().trim().max(30).optional().default(""),
    note: z.string().trim().max(500, "Note is too long.").optional().default(""),
    createAccount: z.boolean().optional().default(false),
    password: z.string().optional().default(""),
    saveAddress: z.boolean().optional().default(false),
  })
  .superRefine((d, ctx) => {
    if (d.createAccount) {
      const p = passwordSchema.safeParse(d.password);
      if (!p.success) ctx.addIssue({ code: "custom", path: ["password"], message: p.error.issues[0].message });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;

export const trackSchema = z.object({
  orderNo: z.string().trim().toUpperCase().regex(/^OV-\d{6}-\d{4}$/, "Order numbers look like OV-261022-0001."),
  /** The phone or email used at checkout. */
  contact: z.string().trim().min(3, "Enter the phone number or email used at checkout.").max(120),
});
