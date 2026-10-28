# Oxford Vale — Step 1 proposal: stack, folder structure, data models

Status: **awaiting developer approval**. No code until approved (brief → Working method 1).
Scope source: `notes/brief.md`. Products: `notes/assets/products.csv` (150 products, 11 categories, 677 size variants).

## 1. Stack
| Concern | Choice | Why |
|---|---|---|
| App | Next.js 16 App Router + React 19 + TypeScript (workshop starter) | Server actions + route handlers in one app; starter already has SEO, layout, contact helpers |
| Styling | Tailwind CSS 4, tokens in `app/globals.css` `@theme` | Starter default |
| Fonts | Playfair Display (headings, wordmark) + Inter (body/UI) via `next/font` | Brief |
| Database | MongoDB + Mongoose 9 (starter) | Flexible product/variant docs; Atlas free tier for the demo |
| Auth | Own session auth: bcryptjs hashes, random session token in httpOnly cookie, `Session` collection with TTL | One system for customers and admin roles; no beta dependency; fully testable. `proxy.ts` only redirects, real checks run in every admin/account layout and server action |
| Validation | zod 4: shared schemas in `lib/validation/`, used by forms (client) and actions/routes (server) | Brief |
| Email | Adapter: `log` (dev, writes to console + `NotificationLog`) or `smtp` (nodemailer) | Swap with `EMAIL_PROVIDER` |
| SMS | Adapter: `log` (default) · `sslwireless` · `bulksmsbd` behind one `SmsProvider` interface | Brief |
| Payments | COD · bKash/Nagad manual (Trx ID, admin verifies) · SSLCommerz adapter with `SSLCOMMERZ_MODE=mock|sandbox|live` | `mock` works with zero credentials; `sandbox` needs free SSLCommerz developer store ID |
| PDF invoices | `@react-pdf/renderer` in a route handler | Server-side, no headless browser |
| Charts | Small hand-written SVG bar/line chart | No chart library for one dashboard chart |
| Rate limiting | Mongo `RateLimit` collection (fixed window, TTL index) | Works across serverless instances, no Redis needed |
| Sanitising | `sanitize-html` with no allowed tags, applied to all free text before saving | Brief |
| i18n | `lib/i18n/en.ts` + `bn.ts` dictionaries, `lang` cookie, `t()` helper; English default; product data stays English | Brief (UI labels only) |
| Tests | Vitest + `mongodb-memory-server` for the checkout API test | Brief |
| Images | Product photos in `public/products/<SKU>/1.webp, 2.webp`; admin uploads via `StorageProvider` (`local` → `public/uploads/`; Cloudinary/S3 later) | Seed attaches by SKU folder |
| Jobs | Abandoned-cart sweep: `/api/cron/abandoned-carts` (needs `CRON_SECRET`, Vercel Cron in prod), `npm run jobs:abandoned` locally, and an automatic sweep when an admin opens Dashboard or Leads | Works locally without a cron runner |
| Deploy | Vercel + MongoDB Atlas | sme-core default |

The `frontend-design` skill named in the brief is not installed in this environment. UI follows the sme-core design rules + the Evora reference.

## 2. Folder structure
```
app/
  (store)/                         storefront layout: announcement bar, sticky header, footer
    page.tsx                       Home
    shop/page.tsx                  All products (filters, sort, pagination)
    shop/[category]/page.tsx       Category listing
    collections/[slug]/page.tsx    New Season, Best Sellers, Heritage…
    product/[slug]/page.tsx        Product detail
    search/page.tsx                Search results
    cart/page.tsx
    checkout/page.tsx
    checkout/pay/[orderNo]/page.tsx   bKash/Nagad Trx ID form · SSLCommerz retry
    order/[orderNo]/page.tsx       Confirmation (needs orderNo + phone or session)
    track-order/page.tsx
    account/  login · register · forgot-password · reset-password/[token]
              page.tsx (overview) · orders · orders/[orderNo] · addresses · wishlist
    about · contact · size-guide · shipping-policy · returns-policy · privacy · terms
  admin/
    login/page.tsx
    (panel)/layout.tsx             role guard + sidebar
      page.tsx                     Dashboard
      products/ (list, new, [id])  categories/  collections/
      orders/ (list, [orderNo])    customers/ (Customers & Leads)
      coupons/  delivery-zones/  settings/  users/  audit-log/  messages/ (contact + notification log)
  api/
    search/suggest/route.ts
    payments/sslcommerz/{success,fail,cancel,ipn}/route.ts
    payments/mock/route.ts         fake gateway page for SSLCOMMERZ_MODE=mock
    cron/abandoned-carts/route.ts
    admin/leads/export/route.ts    CSV
    admin/orders/[orderNo]/invoice/route.ts   PDF
components/
  ui/       Button, Input, Select, Checkbox, Badge, Modal, Drawer, Skeleton, EmptyState, Pagination, Toast, Price
  store/    Header, MobileMenu, AnnouncementBar, Hero, CategoryStrip, FeatureBar, NewSeasonBanner, ProductCard,
            ProductGrid, Filters, Gallery, SizeSelector, ColourSelector, QtyInput, CartDrawer, LeadCaptureModal,
            AddressFields, SearchBox, LanguageToggle
  admin/    Sidebar, DataTable, StatCard, SalesChart, ImageManager, VariantEditor, StatusBadge
server/                            server-only code ("server-only" import)
  actions/  cart.ts · lead.ts · checkout.ts · auth.ts · account.ts · contact.ts · admin/*.ts
  services/ pricing.ts (pure) · cart.ts · coupon.ts · stock.ts · order.ts · lead.ts · search.ts
            settings.ts · audit.ts · notify.ts
  auth/     session.ts · password.ts · rbac.ts (role → permissions map)
  adapters/ email/{index,log,smtp}.ts · sms/{index,log,sslwireless,bulksmsbd}.ts
            payments/{index,sslcommerz,mock}.ts · storage/{index,local}.ts
  db.ts · rate-limit.ts · sanitize.ts · result.ts (one error shape for every action/route)
models/     one file per model (see §3)
lib/        client-safe: money.ts (৳ formatting) · validation/*.ts (zod) · bd-geo/ (division → district → upazila JSON)
            i18n/{en,bn,index}.ts · size-ranges.ts · slug.ts
data/       static copy only: about, size guide, policies, privacy, terms (starter pattern)
scripts/    seed.ts · jobs-abandoned.ts · fetch-product-images.ts (downloads + writes credits)
data/seed/  products.csv (copy of notes/assets/products.csv)
tests/      pricing.test.ts · cart.test.ts · coupon.test.ts · checkout.api.test.ts
proxy.ts    redirect /admin/* and /account/* without a session cookie
PROGRESS.md · README.md · .env.example
```
Editable store info (contact, hero, announcement bar, socials, delivery settings) lives in the `Setting` document so admin can change it. Long static text stays in `data/`.

## 3. Data models
All money is **whole taka integers**. All timestamps via `{ timestamps: true }`.

**User**: name, email (unique, lowercase), phone, passwordHash, role `customer|staff|manager|owner`, addresses[] (embedded: label, name, phone, division, district, upazila, addressLine, isDefault), wishlist [Product], isActive, lastLoginAt.
**Session**: tokenHash, user, expiresAt (TTL index), userAgent, ip. **PasswordResetToken**: user, tokenHash, expiresAt (TTL), usedAt.

**Category**: name, slug (unique), description, image, sortOrder, isActive, seoTitle, seoDescription.
**Collection**: name, slug, description, image, products [Product] (ordered), isActive, sortOrder. Seed creates one per CSV tag (Best Seller, New Season, Heritage, Winter, Summer, Limited).

**Product**: name, slug (unique), skuBase (`OV-SUT-001`), category, collections [Collection], tags[], description, fabric, careNotes, images[] {url, alt, sortOrder}, price, salePrice?, status `draft|active|archived`, sizeType `chest|waist|shoe-eu|alpha|hat|one-size`, colours[] (denormalised from variants, for filters), sizes[] (denormalised), minPrice (effective price, for sort/filter), inStock (denormalised), seoTitle, seoDescription. Text index on name, fabric, tags.
**Variant** (own collection, so stock updates and low-stock queries are simple): product, sku (unique, e.g. `OV-SUT-001-CHA-40`), size, colour, colourHex?, stock, priceOverride?, isActive. Colour selector appears only when a product has >1 colour (all 150 CSV products have one; admin can add more).

**Cart**: cartToken (cookie, unique), user?, items[] {variant, product, qty, addedAt}, couponCode?, lead?, status `active|converted`, lastActivityAt, TTL 30 days. No prices stored; totals are always computed from the DB.
**Lead**: name, phone, email, cart, user?, source `add_to_cart|checkout`, status `cart|abandoned|converted`, cartSnapshot[] {name, sku, size, colour, qty, unitPrice}, cartValue, lastActivityAt, abandonedAt?, adminNotifiedAt?, order?. Upserted per cart; snapshot refreshed on every cart change.

**Order**: orderNo (unique, `OV-261022-0001` from `Counter`), user?, cart, lead, customer {name, phone, email}, shippingAddress {name, phone, division, district, upazila, addressLine}, items[] = **OrderItem** (embedded snapshot: product, variant, sku, name, size, colour, image, regularPrice, unitPrice, qty, lineTotal), subtotal, couponCode?, discount, delivery {zone, name, fee, etaMinDays, etaMaxDays}, total, paymentMethod `cod|sslcommerz|bkash|nagad`, paymentStatus `unpaid|paid|failed|refunded`, payment {trxId?, senderNumber?, gatewayTranId?, valId?, verifiedBy?, verifiedAt?}, status `pending|confirmed|processing|shipped|delivered|cancelled|returned|refunded`, statusHistory[] {status, at, by?, note?}, internalNotes[] {text, by, at}, stockRestoredAt?, cancelledBy?.
OrderItem is embedded rather than its own collection: it is a price snapshot that is always read with its order. If you want it as a separate collection, say so.

**Coupon**: code (unique, uppercase), type `percent|fixed`, value, maxDiscount? (percent only), minOrder, startsAt?, expiresAt, usageLimit, usedCount, perCustomerLimit?, isActive.
**DeliveryZone**: name, fee, etaMinDays, etaMaxDays, match rules {divisions[], districts[], areas[]} (most specific match wins), sortOrder, isActive. Seed zones: Dhaka City ৳80 / 1–2 days · Dhaka (outside city) ৳120 / 2–3 days · Chattogram ৳130 / 2–4 days · Rest of Bangladesh ৳150 / 3–5 days. Seed settings: freeDeliveryThreshold ৳10,000, abandonedAfterMinutes 60.
**Setting** (single doc, cached with a tag): storeName, tagline, legal {name, tradeLicence, tin, bin}, contact {phone, whatsapp, email, supportEmail, ordersEmail}, address, hours[], socials, announcementBar {text, link, active}, hero {eyebrow, title, subtitle, image, ctas}, newSeasonBanner, freeDeliveryThreshold, abandonedAfterMinutes, lowStockThreshold, payments {cod, sslcommerz, bkash {enabled, number}, nagad {enabled, number}}, bank {accountName, accountNo, bankBranch}, invoiceFooter.
**AuditLog**: actor, actorName, actorRole, action (`order.status.update`, `product.archive`…), entity {type, id, label}, changes (before/after of changed fields), ip, at.

Supporting models: **ContactMessage** (name, email, phone?, subject, message, status, ip) · **NotificationLog** (channel email|sms, to, subject, body, provider, status, error, ref) so mocked emails/SMS are visible in admin · **Counter** (order number sequence) · **RateLimit** (key, count, expiresAt TTL).
The starter `Lead` model (contact-form lead) is replaced by the new `Lead` + `ContactMessage`.

## 4. Key rules
- **Pricing** (`server/services/pricing.ts`, pure and unit-tested): unitPrice = variant.priceOverride ?? product.salePrice ?? product.price → subtotal → coupon discount (percent rounded down to whole taka, capped by maxDiscount; fixed ≤ subtotal) → delivery fee from zone, **free when subtotal − discount ≥ freeDeliveryThreshold** → total. The client never sends prices.
- **Stock**: on order, each variant is decremented atomically with `{stock: {$gte: qty}}`; if any line fails, earlier lines roll back and the customer sees which item ran out. Restored once (`stockRestoredAt`) on cancel; admin chooses "restock" when marking Returned. Works on standalone local Mongo (no replica set needed).
- **Coupons**: validated (active, dates, minOrder, usage limit, per-customer limit), then `usedCount` is incremented with a conditional update at order time.
- **Lead capture**: first add-to-cart opens a short modal (name, phone `01XXXXXXXXX`, email) → Lead `cart`. The modal can be skipped ("Skip, I'll add details at checkout"): the item is still added and the lead is created at checkout instead (source `checkout`). Skipping is remembered on the cart, so the modal does not reappear. Logged-in customers are prefilled and skip it. Checkout updates the same lead. Order placed → `converted`. Sweep marks `cart` leads idle > `abandonedAfterMinutes` (default 60) as `abandoned` and emails the admin one digest.
- **Payments**:
  - COD: order `pending` / `unpaid`.
  - bKash/Nagad manual: customer sees the merchant number + amount, submits Trx ID + sender number. It stays `unpaid` with "awaiting verification" until admin verifies → `paid`, order `confirmed`.
  - SSLCommerz: create session → redirect → IPN/success validated server-side with the validation API → `paid`. Fail/cancel → `failed`; customer can retry or switch to COD.
- **Customer cancel**: allowed only while `pending`; restores stock and coupon usage.
- **Notifications** (`server/services/notify.ts`): order placed → customer email + SMS, admin email (Setting.contact.ordersEmail); contact message → admin email; abandoned digest → admin email; shipped → customer SMS. Every message is written to `NotificationLog`.
- **RBAC**:

  | Area | Owner | Manager | Staff |
  |---|---|---|---|
  | Dashboard, Orders (view, status, verify payment, notes, invoice), Customers & Leads (view, export) | ✓ | ✓ | ✓ |
  | Products, Categories, Collections, Coupons, Delivery zones | ✓ | ✓ | view |
  | Site settings, Admin users, Audit log | ✓ | — | — |

- **Rate limits**: login 5/15 min per IP+email · register 5/hour per IP · checkout 10/10 min per IP · contact 5/hour per IP · forgot-password 3/hour per email.
- **Errors**: every action/route returns `{ ok: true, data } | { ok: false, error: { code, message, fields? } }`.

## 5. Seed (`npm run seed`)
- Owner admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, plus one Manager and one Staff demo user.
- 11 categories from the CSV, 6 tag collections.
- **All 150 products** from `data/seed/products.csv` (the brief says ~20, but the full list is supplied; `--limit 20` flag for a quick seed).
- Size ranges expand: `38-46` / `36-46` / `28-40` in steps of 2 · `40-45` in steps of 1 · `S-XXL` = S M L XL XXL · `S-XL` · `M/L` = M, L · `One Size`.
- Description and care notes are generated from name + fabric + tag with a fixed template per fabric family (wool, tweed, linen, cotton, leather, suede, silk, knit…).
- Images attached from `public/products/<SKU>/` (1 = main, 2 = hover). Products without photos get a neutral placeholder.
- Business details from the brief, delivery zones, sample coupons (`WELCOME10` 10% min ৳3,000 · `FLAT500` ৳500 off min ৳5,000), demo orders + leads for the dashboard (`--demo`).

## 6. Environment variables (`.env.example`)
`APP_URL` · `MONGODB_URI` · `SESSION_SECRET` · `CRON_SECRET` · `EMAIL_PROVIDER` (log|smtp) · `EMAIL_FROM` · `SMTP_HOST` · `SMTP_PORT` · `SMTP_USER` · `SMTP_PASS` · `SMS_PROVIDER` (log|sslwireless|bulksmsbd) · `SSLWIRELESS_API_TOKEN` · `SSLWIRELESS_SID` · `BULKSMSBD_API_KEY` · `BULKSMSBD_SENDER_ID` · `SSLCOMMERZ_MODE` (mock|sandbox|live) · `SSLCOMMERZ_STORE_ID` · `SSLCOMMERZ_STORE_PASSWORD` · `STORAGE_PROVIDER` (local) · `SEED_ADMIN_EMAIL` · `SEED_ADMIN_PASSWORD`

## 7. Images
### Developer provides (put in `public/brand/`)
Style for all: muted, warm, slightly desaturated; charcoal / brown / grey tweed wardrobe; soft natural light; plain or architectural backgrounds; same model across shots if possible.
| File | Shot | Size / format |
|---|---|---|
| `hero-model.png` | Full-length man walking or standing in a long dark overcoat + flat cap, **cut-out on a transparent background** so the "OXFORD VALE" wordmark can sit behind him (as in the reference) | Portrait, ≥ 1600×2200 px, PNG |
| `hero-model-mobile.jpg` (optional) | Same look, tighter crop for phones | 1080×1350 |
| `new-season.jpg` | Waist-up man in tweed cap and coat, subject on the right, clean space on the left for text | Landscape 2400×1200 |
| `cat-suits.jpg` · `cat-outerwear.jpg` · `cat-accessories.jpg` · `cat-caps.jpg` · `cat-shoes.jpg` | One per category card: model in a suit; model in a coat; pocket watch / cufflinks close-up; flat cap close-up; leather shoes | 4:5 portrait, 800×1000 each |
| `about-1.jpg` · `about-2.jpg` | Tailoring / craft close-up (hands, measuring tape, fabric) and a styled flat-lay or showroom interior | Landscape 1600×1000 |
| `auth-side.jpg` (optional) | Moody detail shot (tweed texture, coat lapel) for login/register | Portrait 1200×1600 |
| `og-image.jpg` | Social share image (wordmark + model) — I can build this from the hero | 1200×630 |

No logo file is needed: the wordmark is set in Playfair Display, and the favicon is an "OV" monogram. If you have a logo, add it as `public/brand/logo.svg`.

### Claude sources: product photos
- From free-licence sites (Unsplash, Pexels): 2 per product (main + hover), 4:5 crop, converted to WebP into `public/products/<SKU>/`. Downloaded once, never hotlinked.
- Every photo is logged in `notes/image-credits.md` (photographer, source URL, licence).
- An exact match for each of 150 products isn't realistic. Each product gets the closest match (same garment type and colour); some similar items share photos.

## 8. Build order (after approval)
1. Setup + seed → 2. storefront browsing → 3. cart + lead capture → 4. checkout + orders → 5. admin panel → 6. notifications → 7. polish.
After each step: run the app, report what works / what is mocked, update `PROGRESS.md` and the project CLAUDE.md Status.

## 9. Decisions (resolved 2026-10-22)
1. **Lead modal**: skippable. Skipping defers lead capture to checkout (see §4).
2. **Seed size**: all 150 products (`--limit 20` stays available).
3. **Delivery zones**: defaults accepted as listed in §3 (editable in admin).
4. **Placeholder phones**: keep `01700-00000x`.
