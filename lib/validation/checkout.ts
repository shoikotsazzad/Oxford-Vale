import { z } from "zod";
import { emailSchema, nameSchema, phoneSchema } from "./common";
import { addressSchema } from "./address";
import { passwordSchema } from "./auth";

export const PAYMENT_OPTIONS = ["cod", "sslcommerz", "bkash", "nagad"] as const;

export const checkoutSchema = z
  .object({
    contact: z.object({ name: nameSchema, phone: phoneSchema, email: emailSchema }),
    address: addressSchema,
    paymentMethod: z.enum(PAYMENT_OPTIONS, "Choose a payment method."),
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

/** bKash / Nagad transaction IDs are 8–10 letters/digits. */
export const manualPaymentSchema = z.object({
  orderNo: z.string().regex(/^OV-\d{6}-\d{4}$/),
  key: z.string().min(10).max(40),
  trxId: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{8,12}$/, "Enter the transaction ID from your bKash/Nagad message (8–12 letters and numbers)."),
  senderNumber: phoneSchema,
});

export const trackSchema = z.object({
  orderNo: z.string().trim().toUpperCase().regex(/^OV-\d{6}-\d{4}$/, "Order numbers look like OV-261022-0001."),
  phone: phoneSchema,
});
