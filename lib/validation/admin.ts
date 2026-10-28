// Admin form schemas. Shared by the admin forms (client) and admin actions (server).
import { z } from "zod";
import { ORDER_STATUSES, SIZE_TYPES } from "@/models/enums";
import { emailSchema, nameSchema, objectIdSchema, optionalEmailSchema, phoneSchema } from "./common";

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const taka = z.coerce.number({ error: "Enter an amount in taka." }).int("Whole taka only.").min(0, "Can't be negative.").max(10_000_000, "Too large.");
const optionalTaka = z.union([z.literal(""), z.null(), z.undefined(), taka]).transform((v) => (v === "" || v === null || v === undefined ? undefined : v));
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
export const rejectPaymentSchema = orderRefSchema.extend({ reason: text(200).min(3, "Say why, e.g. \"Trx ID not found\".") });
export const orderNoteSchema = orderRefSchema.extend({ text: text(1000).min(1, "Write a note.") });

// Catalog
export const variantInputSchema = z.object({
  id: objectIdSchema.optional(),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,40}$/, "Letters, numbers and dashes.").or(z.literal("")),
  size: text(20).min(1, "Size?"),
  colour: text(40).min(1, "Colour?"),
  colourHex: hex,
  stock: count(),
  priceOverride: optionalTaka,
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
    price: taka.refine((v) => v > 0, "Enter the price."),
    salePrice: optionalTaka,
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
    value: count(10_000_000).refine((v) => v > 0, "Enter a value."),
    maxDiscount: optionalTaka,
    minOrder: taka,
    startsAt: date,
    expiresAt: date.refine((v) => v !== "", "Set an end date."),
    usageLimit: count(),
    perCustomerLimit: count(1000),
    isActive: z.boolean(),
  })
  .superRefine((c, ctx) => {
    if (c.type === "percent" && c.value > 90) ctx.addIssue({ code: "custom", path: ["value"], message: "Percent coupons can be at most 90%." });
    if (c.startsAt && Date.parse(c.startsAt) >= Date.parse(c.expiresAt)) ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "End date must be after the start date." });
  });

export const zoneSchema = z
  .object({
    id: objectIdSchema.optional(),
    name: text(60).min(2, "Enter a name."),
    fee: taka,
    etaMinDays: count(30),
    etaMaxDays: count(30),
    divisions: z.array(text(40)).max(8),
    districts: z.array(text(40)).max(64),
    areas: z.array(text(60)).max(600),
    sortOrder: count(1000),
    isActive: z.boolean(),
  })
  .refine((z) => z.etaMaxDays >= z.etaMinDays, { path: ["etaMaxDays"], message: "Must be at least the minimum." });

// Settings (owner)
const cta = z.object({ label: text(40), href: url });
export const settingsSchema = z.object({
  storeName: text(60).min(2, "Enter the store name."),
  tagline: text(120),
  legal: z.object({ name: text(120), tradeLicence: text(60), tin: text(40), bin: text(40) }),
  contact: z.object({ phone: text(30), whatsapp: text(30), email: optionalEmailSchema, supportEmail: optionalEmailSchema, ordersEmail: optionalEmailSchema }),
  address: z.object({ line: text(160), area: text(80), city: text(60), postalCode: text(10), country: text(60) }),
  hours: z.array(z.object({ label: text(40), value: text(60) })).max(7),
  socials: z.object({ facebook: url, instagram: url, youtube: url, tiktok: url }),
  announcementBar: z.object({ text: text(160), link: url, active: z.boolean() }),
  hero: z.object({ eyebrow: text(60), title: text(60), subtitle: text(200), image: url, note: text(120), ctas: z.array(cta).max(2) }),
  newSeasonBanner: z.object({ eyebrow: text(60), title: text(80), text: text(300), image: url, cta }),
  freeDeliveryThreshold: taka,
  abandonedAfterMinutes: count(10_080).refine((v) => v >= 15, "At least 15 minutes."),
  lowStockThreshold: count(1000),
  payments: z.object({
    cod: z.boolean(),
    sslcommerz: z.boolean(),
    bkash: z.object({ enabled: z.boolean(), number: text(20) }),
    nagad: z.object({ enabled: z.boolean(), number: text(20) }),
  }),
  bank: z.object({ accountName: text(120), accountNo: text(40), bankBranch: text(120) }),
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

export const testNotificationSchema = z.discriminatedUnion("channel", [
  z.object({ channel: z.literal("email"), to: emailSchema }),
  z.object({ channel: z.literal("sms"), to: phoneSchema }),
]);
