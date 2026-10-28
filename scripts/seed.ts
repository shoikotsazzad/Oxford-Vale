// npm run seed [-- --limit 20] [-- --fresh] [-- --demo] [-- --demo-clear]
// Idempotent: upserts by slug / SKU / code. Re-running resets CSV fields (name, price, photos, collections) of seeded
// products, so after editing the catalog in the admin, don't re-run the plain seed. --fresh wipes the catalog first.
// --demo / --demo-clear only add or remove demo orders, leads and messages.
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { connectDB, disconnectDB } from "@/server/db";
import {
  CategoryModel, CollectionModel, CouponModel, DeliveryZoneModel, ProductModel, SettingModel, UserModel, VariantModel,
} from "@/models";
import type { Role } from "@/models/shared";
import { hashPassword } from "@/server/auth/password";
import { syncProductSummary } from "@/server/services/catalog-sync";
import { site } from "@/data/site";
import { DHAKA_CITY_AREAS } from "@/lib/bd-geo";
import { slugify } from "@/lib/slug";
import { expandSizes, sizeTypeFor } from "@/lib/size-ranges";
import { colourHex } from "@/lib/colours";
import { readProductsCsv } from "./seed/csv";
import { describe } from "./seed/copy";
import { clearDemo, seedDemo } from "./seed/demo";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const limitArg = args.indexOf("--limit");
const LIMIT = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
const ROOT = process.cwd();
const log = (...m: unknown[]) => console.log("•", ...m);

const CATEGORY_ORDER = ["Suits", "Blazers", "Outerwear", "Waistcoats", "Shirts", "Trousers", "Knitwear", "Ties", "Accessories", "Caps", "Shoes"];
const NAV_CATEGORIES = new Set(["Suits", "Outerwear", "Shirts", "Accessories", "Caps", "Shoes"]);
const CATEGORY_COPY: Record<string, string> = {
  Suits: "Two- and three-piece suits in wool, tweed and linen, tailored for weddings, work and evenings out.",
  Blazers: "Single- and double-breasted blazers that sharpen everything from chinos to denim.",
  Outerwear: "Overcoats, trench coats, field jackets and quilted layers for the cooler months.",
  Waistcoats: "Tailored waistcoats in tweed, wool and linen, worn with a suit or on their own.",
  Shirts: "Formal, Oxford and casual shirts in breathable cotton and linen.",
  Trousers: "Tailored trousers, chinos and corduroys with a clean, comfortable fit.",
  Knitwear: "Merino, lambswool and cable knits to layer under jackets and coats.",
  Ties: "Silk and wool ties, bow ties and pocket squares to finish the look.",
  Accessories: "Belts, cufflinks, scarves, wallets and the small details of a heritage wardrobe.",
  Caps: "Flat caps, baker boy caps and classic hats in tweed, wool and straw.",
  Shoes: "Brogues, Oxfords, loafers, Chelsea and chukka boots in leather and suede.",
};
const COLLECTIONS: Record<string, { name: string; description: string }> = {
  "Best Seller": { name: "Best Sellers", description: "The pieces our customers come back for." },
  "New Season": { name: "New Season", description: "New arrivals for the season ahead." },
  Heritage: { name: "Heritage", description: "Traditional English dress, reworked for today." },
  Winter: { name: "Winter Edit", description: "Warm layers for the colder months." },
  Summer: { name: "Summer Edit", description: "Light fabrics for warm Bangladeshi days." },
  Limited: { name: "Limited Edition", description: "Made in small runs. Once they are gone, they are gone." },
};

const colourCode = (c: string) => c.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase();
const sizeCode = (s: string) => (s === "One Size" ? "OS" : s.replace(/[^a-z0-9]/gi, "").toUpperCase());

/** Images from public/products/<SKU>/ (sorted: 1 = main, 2 = hover). */
function imagesFor(sku: string, name: string) {
  const dir = path.join(ROOT, "public", "products", sku);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f))
    .sort()
    .map((f, i) => ({ url: `/products/${sku}/${f}`, alt: i === 0 ? name : `${name}, alternate view`, sortOrder: i }));
}

async function seedSettings() {
  await SettingModel.updateOne(
    { key: "store" },
    {
      $setOnInsert: {
        key: "store",
        storeName: site.name,
        tagline: site.tagline,
        legal: site.legal,
        contact: { phone: site.phoneDisplay, whatsapp: site.whatsappDisplay, email: site.email, supportEmail: site.supportEmail, ordersEmail: site.ordersEmail },
        address: site.address,
        hours: site.hoursText,
        socials: site.socials,
        announcementBar: { ...site.announcement, active: true },
        hero: site.hero,
        newSeasonBanner: site.newSeasonBanner,
        freeDeliveryThreshold: site.freeDeliveryThreshold,
        abandonedAfterMinutes: site.abandonedAfterMinutes,
        lowStockThreshold: site.lowStockThreshold,
        payments: {
          cod: true,
          sslcommerz: true,
          bkash: { enabled: true, number: site.payments.bkashNumber },
          nagad: { enabled: true, number: site.payments.nagadNumber },
        },
        bank: site.bank,
        invoiceFooter: site.invoiceFooter,
      },
    },
    { upsert: true },
  );
  log("Settings (kept if they already exist)");
}

async function seedUsers() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (min 8 characters) in .env.local before seeding.");
  }
  const demoPassword = process.env.SEED_DEMO_PASSWORD || password;
  const users: { email: string; name: string; role: Role; password: string }[] = [
    { email, name: "Store Owner", role: "owner", password },
    { email: "manager@oxfordvale.example", name: "Demo Manager", role: "manager", password: demoPassword },
    { email: "staff@oxfordvale.example", name: "Demo Staff", role: "staff", password: demoPassword },
  ];
  for (const u of users) {
    const exists = await UserModel.exists({ email: u.email });
    if (exists) {
      await UserModel.updateOne({ email: u.email }, { role: u.role, isActive: true });
    } else {
      await UserModel.create({ email: u.email, name: u.name, role: u.role, passwordHash: await hashPassword(u.password) });
    }
  }
  log(`Admin users: ${users.map((u) => `${u.email} (${u.role})`).join(", ")}`);
}

async function seedZones() {
  const zones = [
    { name: "Dhaka City", fee: 80, etaMinDays: 1, etaMaxDays: 2, match: { divisions: [], districts: [], areas: DHAKA_CITY_AREAS }, sortOrder: 1 },
    { name: "Dhaka (outside city)", fee: 120, etaMinDays: 2, etaMaxDays: 3, match: { divisions: [], districts: ["Dhaka", "Gazipur", "Narayanganj"], areas: [] }, sortOrder: 2 },
    { name: "Chattogram", fee: 130, etaMinDays: 2, etaMaxDays: 4, match: { divisions: [], districts: ["Chattogram"], areas: [] }, sortOrder: 3 },
    { name: "Rest of Bangladesh", fee: 150, etaMinDays: 3, etaMaxDays: 5, match: { divisions: [], districts: [], areas: [] }, sortOrder: 4 },
  ];
  for (const z of zones) await DeliveryZoneModel.updateOne({ name: z.name }, { $setOnInsert: z }, { upsert: true });
  log(`Delivery zones: ${zones.map((z) => `${z.name} ৳${z.fee}`).join(" · ")}`);
}

async function seedCoupons() {
  const expiresAt = new Date("2027-12-31T23:59:59+06:00");
  const coupons = [
    { code: "WELCOME10", description: "10% off your first order over ৳3,000", type: "percent", value: 10, minOrder: 3000, expiresAt, usageLimit: 0, perCustomerLimit: 1 },
    { code: "FLAT500", description: "৳500 off orders over ৳5,000", type: "fixed", value: 500, minOrder: 5000, expiresAt, usageLimit: 200, perCustomerLimit: 0 },
  ];
  for (const c of coupons) await CouponModel.updateOne({ code: c.code }, { $setOnInsert: c }, { upsert: true });
  log(`Coupons: ${coupons.map((c) => c.code).join(", ")}`);
}

async function seedCatalog() {
  const rows = readProductsCsv(path.join(ROOT, "data/seed/products.csv")).slice(0, LIMIT);

  if (flag("fresh")) {
    await Promise.all([ProductModel.deleteMany({}), VariantModel.deleteMany({}), CategoryModel.deleteMany({}), CollectionModel.deleteMany({})]);
    log("Catalog wiped (--fresh)");
  }

  const categories = new Map<string, string>();
  for (const name of [...new Set(rows.map((r) => r.category))].sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))) {
    const slug = slugify(name);
    const doc = await CategoryModel.findOneAndUpdate(
      { slug },
      {
        $set: { name, sortOrder: CATEGORY_ORDER.indexOf(name) + 1, showInNav: NAV_CATEGORIES.has(name) },
        $setOnInsert: {
          description: CATEGORY_COPY[name] ?? "",
          image: `/brand/cat-${slug}.jpg`,
          seoTitle: `${name} for Men`,
          seoDescription: `Shop men's ${name.toLowerCase()} at Oxford Vale. ${CATEGORY_COPY[name] ?? ""} Cash on delivery across Bangladesh.`.trim(),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    categories.set(name, String(doc._id));
  }
  log(`Categories: ${categories.size}`);

  const collections = new Map<string, string>();
  let order = 0;
  for (const [tag, c] of Object.entries(COLLECTIONS)) {
    if (!rows.some((r) => r.tag === tag)) continue;
    const doc = await CollectionModel.findOneAndUpdate(
      { slug: slugify(c.name) },
      { $setOnInsert: { name: c.name, description: c.description, sortOrder: ++order } },
      { upsert: true, returnDocument: "after" },
    );
    collections.set(tag, String(doc._id));
  }

  const collectionProducts = new Map<string, string[]>();
  let variantCount = 0;
  let withImages = 0;
  for (const r of rows) {
    const sizes = expandSizes(r.sizes, r.category);
    const { description, careNotes } = describe(r);
    const images = imagesFor(r.sku, r.name);
    if (images.length) withImages++;
    const collectionId = collections.get(r.tag);

    const product = await ProductModel.findOneAndUpdate(
      { skuBase: r.sku },
      {
        $set: {
          name: r.name,
          category: categories.get(r.category),
          collections: collectionId ? [collectionId] : [],
          tags: r.tag ? [r.tag] : [],
          fabric: r.fabric,
          price: r.price,
          ...(r.salePrice ? { salePrice: r.salePrice } : {}),
          sizeType: sizeTypeFor(r.category, sizes),
          images,
        },
        ...(r.salePrice ? {} : { $unset: { salePrice: 1 } }),
        $setOnInsert: {
          slug: slugify(r.name),
          description,
          careNotes,
          status: "active",
          seoTitle: r.name,
          seoDescription: `${r.name} in ${r.fabric.toLowerCase()}. Buy online at Oxford Vale with cash on delivery across Bangladesh.`,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    for (const [i, size] of sizes.entries()) {
      const sku = `${r.sku}-${colourCode(r.colour)}-${sizeCode(size)}`;
      await VariantModel.updateOne(
        { sku },
        {
          $set: { product: product._id, size, colour: r.colour, colourHex: colourHex(r.colour), sortOrder: i },
          $setOnInsert: { stock: r.stockPerSize, isActive: true },
        },
        { upsert: true },
      );
      variantCount++;
    }
    await syncProductSummary(product._id);
    if (collectionId) collectionProducts.set(collectionId, [...(collectionProducts.get(collectionId) ?? []), String(product._id)]);
  }

  for (const [id, products] of collectionProducts) await CollectionModel.updateOne({ _id: id }, { products });
  log(`Products: ${rows.length} (${variantCount} variants, ${withImages} with photos)`);
  log(`Collections: ${[...collections.keys()].map((t) => COLLECTIONS[t].name).join(", ")}`);
  if (withImages < rows.length) log(`${rows.length - withImages} products have no photos yet → run: npm run images`);
}

async function main() {
  const started = Date.now();
  await connectDB();
  // Demo flags only add/remove demo records: they never re-apply the CSV over catalog edits made in the admin.
  if (flag("demo") || flag("demo-clear")) {
    const d = flag("demo") ? await seedDemo() : await clearDemo();
    log(flag("demo")
      ? `Demo data: ${d.orders} orders, ${d.leads} leads, ${d.messages} messages (remove with --demo-clear)`
      : `Demo data removed: ${d.orders} orders, ${d.leads} leads, ${d.messages} messages (stock restored)`);
  } else {
    await Promise.all([ProductModel.init(), VariantModel.init(), UserModel.init()]);
    await seedSettings();
    await seedUsers();
    await seedZones();
    await seedCoupons();
    await seedCatalog();
  }
  console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((err) => {
    console.error("\nSeed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(disconnectDB);
