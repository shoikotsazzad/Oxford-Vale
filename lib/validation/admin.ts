// Admin form schemas. Shared by the admin forms (client) and admin actions (server).
import { z } from "zod";
import { ORDER_STATUSES, SIZE_TYPES } from "@/models/enums";
import { emailSchema, nameSchema, objectIdSchema, optionalEmailSchema } from "./common";

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
// Money is typed in dollars ("235", "8.95") and stored as whole cents.
const money = z.coerce
  .number({ error: "Enter an amount in dollars." })
  .min(0, "Can't be negative.")
  .max(1_000_000, "Too large.")
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Use at most 2 decimal places.")
  .transform((v) => Math.round(v * 100));
const optionalMoney = z.union([z.literal(""), z.null(), z.undefined(), money]).transform((v) => (v === "" || v === null || v === undefined ? undefined : v));
const count = (max = 100_000) => z.coerce.number().int("Whole numbers only.").min(0, "Can't be negative.").max(max, "Too large.");
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only.").max(120);
const url = z.string().trim().max(500).refine((v) => v === "" || v.startsWith("/") || /^https:\/\//.test(v), "Use a site path (/shop) or an https:// link.");
const hex = z.string().trim().refine((v) => v === "" || /^#[0-9a-f]{6}$/i.test(v), "Use a hex colour like #1E1E1E.");
const date = z.string().trim().refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Enter a valid date.");
export const adminPassword = z.string().min(10, "At least 10 characters.").max(128).regex(/[a-z]/i, "Include a letter.").regex(/\d/, "Include a number.");

export const adminLoginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.").max(128), next: z.string().optional() });

// Orders
export const orderStatusSchema = z.object({
  orderNo: z.string().trim().max(30),
  to: z.enum(ORDER_STATUSES),
  note: text(500).optional(),
  restock: z.boolean().optional(),
  courier: text(60).optional(),
  trackingNo: text(60).optional(),
});
export const orderRefSchema = z.object({ orderNo: z.string().trim().max(30) });
export const orderNoteSchema = orderRefSchema.extend({ text: text(1000).min(1, "Write a note.") });

// Catalog
export const variantInputSchema = z.object({
  id: objectIdSchema.optional(),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,40}$/, "Letters, numbers and dashes.").or(z.literal("")),
  size: text(20).min(1, "Size?"),
  colour: text(40).min(1, "Colour?"),
  colourHex: hex,
  stock: count(),
  priceOverride: optionalMoney,
  isActive: z.boolean(),
});
export const imageInputSchema = z.object({ url: url.refine((v) => v !== "", "Missing image."), alt: text(160) });

export const productSchema = z
  .object({
    id: objectIdSchema.optional(),
    name: text(120).min(2, "Enter the product name."),
    slug: slug.or(z.literal("")),
    skuBase: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,30}$/, "e.g. OV-SUT-001"),
    category: objectIdSchema,
    collections: z.array(objectIdSchema).max(20),
    tags: z.array(text(30).min(1)).max(20),
    description: text(4000),
    fabric: text(200),
    careNotes: text(1000),
    price: money.refine((v) => v > 0, "Enter the price."),
    salePrice: optionalMoney,
    status: z.enum(["draft", "active", "archived"]),
    sizeType: z.enum(SIZE_TYPES),
    seoTitle: text(70),
    seoDescription: text(170),
    images: z.array(imageInputSchema).max(12, "Up to 12 photos."),
    variants: z.array(variantInputSchema).min(1, "Add at least one size.").max(80),
  })
  .superRefine((p, ctx) => {
    if (p.salePrice !== undefined && p.salePrice >= p.price) ctx.addIssue({ code: "custom", path: ["salePrice"], message: "Sale price must be lower than the price." });
    const seen = new Set<string>();
    p.variants.forEach((v, i) => {
      const key = `${v.size}|${v.colour}`.toLowerCase();
      if (seen.has(key)) ctx.addIssue({ code: "custom", path: ["variants", i, "size"], message: "Duplicate size + colour." });
      seen.add(key);
    });
  });
export type ProductInput = z.input<typeof productSchema>;

export const productStatusSchema = z.object({ id: objectIdSchema, status: z.enum(["draft", "active", "archived"]) });
export const idSchema = z.object({ id: objectIdSchema });

export const categorySchema = z.object({
  id: objectIdSchema.optional(),
  name: text(60).min(2, "Enter a name."),
  slug: slug.or(z.literal("")),
  description: text(500),
  image: url,
  sortOrder: count(1000),
  isActive: z.boolean(),
  showInNav: z.boolean(),
  seoTitle: text(70),
  seoDescription: text(170),
});

export const collectionSchema = z.object({
  id: objectIdSchema.optional(),
  name: text(60).min(2, "Enter a name."),
  slug: slug.or(z.literal("")),
  description: text(500),
  image: url,
  sortOrder: count(1000),
  isActive: z.boolean(),
  products: z.array(objectIdSchema).max(500),
});

export const couponSchema = z
  .object({
    id: objectIdSchema.optional(),
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, "3–20 letters or numbers."),
    description: text(200),
    type: z.enum(["percent", "fixed"]),
    // Percent coupons: a whole percentage. Fixed coupons: dollars, stored as cents (converted in the action).
    value: z.coerce.number().min(0, "Can't be negative.").max(1_000_000, "Too large.").refine((v) => v > 0, "Enter a value."),
    maxDiscount: optionalMoney,
    minOrder: money,
    startsAt: date,
    expiresAt: date.refine((v) => v !== "", "Set an end date."),
    usageLimit: count(),
    perCustomerLimit: count(1000),
    isActive: z.boolean(),
  })
  .superRefine((c, ctx) => {
    if (c.type === "percent" && c.value > 90) ctx.addIssue({ code: "custom", path: ["value"], message: "Percent coupons can be at most 90%." });
    if (c.type === "percent" && !Number.isInteger(c.value)) ctx.addIssue({ code: "custom", path: ["value"], message: "Use a whole percentage." });
    if (c.startsAt && Date.parse(c.startsAt) >= Date.parse(c.expiresAt)) ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "End date must be after the start date." });
  });

/** Delivery option: a method (UK Standard, UK Next day…) offered to a list of countries; no countries = rest of the world. */
export const zoneSchema = z
  .object({
    id: objectIdSchema.optional(),
    name: text(60).min(2, "Enter a name."),
    fee: money,
    etaMinDays: count(60),
    etaMaxDays: count(60),
    countries: z.array(z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use 2-letter country codes.")).max(250),
    freeEligible: z.boolean(),
    note: text(120),
    sortOrder: count(1000),
    isActive: z.boolean(),
  })
  .refine((z) => z.etaMaxDays >= z.etaMinDays, { path: ["etaMaxDays"], message: "Must be at least the minimum." });

// Settings (owner)
const cta = z.object({ label: text(40), href: url });
export const settingsSchema = z.object({
  storeName: text(60).min(2, "Enter the store name."),
  tagline: text(120),
  legal: z.object({ name: text(120), companyNo: text(20), vatNo: text(30), registeredOffice: text(160) }),
  contact: z.object({ phone: text(30), freephone: text(30), email: optionalEmailSchema, supportEmail: optionalEmailSchema, ordersEmail: optionalEmailSchema }),
  address: z.object({ line: text(160), area: text(80), city: text(60), postalCode: text(10), country: text(60) }),
  hours: z.array(z.object({ label: text(40), value: text(60) })).max(7),
  socials: z.object({ facebook: url, instagram: url, x: url, youtube: url }),
  announcementBar: z.object({ text: text(160), link: url, active: z.boolean() }),
  hero: z.object({ eyebrow: text(60), title: text(60), subtitle: text(200), image: url, note: text(120), ctas: z.array(cta).max(2) }),
  newSeasonBanner: z.object({ eyebrow: text(60), title: text(80), text: text(300), image: url, cta }),
  freeDeliveryThreshold: money,
  abandonedAfterMinutes: count(10_080).refine((v) => v >= 15, "At least 15 minutes."),
  lowStockThreshold: count(1000),
  payments: z.object({ stripe: z.boolean(), paypal: z.boolean() }),
  bank: z.object({ accountName: text(120), sortCode: text(10), accountNo: text(20), bank: text(120) }),
  invoiceFooter: text(300),
});
export type SettingsInput = z.input<typeof settingsSchema>;

// Admin users (owner)
export const adminUserSchema = z.object({
  id: objectIdSchema.optional(),
  name: nameSchema,
  email: emailSchema,
  role: z.enum(["staff", "manager", "owner"]),
  isActive: z.boolean(),
  password: z.union([z.literal(""), adminPassword]).optional(),
});
export const resetAdminPasswordSchema = z.object({ id: objectIdSchema, password: adminPassword });

export const messageStatusSchema = z.object({ id: objectIdSchema, status: z.enum(["new", "read", "replied", "closed"]) });

export const testNotificationSchema = z.object({ channel: z.literal("email"), to: emailSchema });
