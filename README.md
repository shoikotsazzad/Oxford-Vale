<div align="center">

# OXFORD VALE

**English heritage for a modern generation.**

A full-stack menswear e-commerce store built for the Bangladesh market: suits, outerwear, shirts, caps and shoes, sold in BDT with cash on delivery, SSLCommerz, bKash and Nagad.

`Next.js 16` · `React 19` · `TypeScript` · `Tailwind CSS 4` · `MongoDB / Mongoose` · `Zod` · `Vitest`

</div>

---

> **Portfolio project.** Oxford Vale is a fictional brand. All business details (phone numbers, licence numbers, bank details, domain) are placeholders. Payment, email and SMS integrations run in mock or sandbox mode by default, and each one switches to a real provider with an environment variable.

## What it does

### Storefront
- Home page with a large typographic hero, a category band, a new-season banner, best sellers and a feature bar
- Category and collection listings with filters for size, colour and price range, plus sorting and pagination
- Product pages with an image gallery, size and colour selectors, live stock status, fabric and care notes, and related products
- Search with live suggestions
- A cart that is stored on the server and survives refreshes and devices (cookie token)
- Guest checkout with optional account creation
- Order confirmation, and order tracking by order number and phone
- Customer accounts: register, login, forgot/reset password, order history, saved addresses, wishlist
- English UI with an optional Bangla toggle (i18n dictionary)

### Built for Bangladesh
- Prices in whole taka with the ৳ sign and South Asian digit grouping (৳1,25,000)
- Address form with Division → District → Upazila (all 64 districts), and a `01XXXXXXXXX` mobile number validator
- Delivery zones (Dhaka City, Dhaka outside city, Chattogram, rest of Bangladesh), each with its own fee and delivery estimate, plus a free-delivery threshold. All editable from admin.
- Payments: **Cash on Delivery** (default) · **SSLCommerz** (mock / sandbox / live) · **bKash** and **Nagad** manual payment (the customer submits a transaction ID and an admin verifies it)

### Lead capture and abandoned carts
- The customer's name, phone and email are captured on the first add-to-cart (the prompt can be skipped) or at checkout, and saved as a lead before any order exists
- Carts left unfinished past a set time are marked abandoned, and the admin receives a digest email
- Admin **Customers & Leads** page showing cart contents, last activity and status, with CSV export

### Orders
- Prices are always recalculated on the server from the database; prices sent by the browser are never trusted
- Stock is reserved atomically when an order is placed and restored on cancellation
- Order statuses: Pending → Confirmed → Processing → Shipped → Delivered, plus Cancelled / Returned / Refunded
- Payment statuses: Unpaid, Paid, Failed, Refunded
- Customers can cancel while an order is still Pending
- Coupons: percentage or fixed amount, with expiry, usage limit, per-customer limit and minimum order value
- Notifications, sent after the response so they never slow down or break checkout:
  - Customer: order received (email + SMS, with bKash/Nagad payment instructions), payment received (email), shipped with courier + tracking (SMS + email)
  - Admin: new order, contact form message (reply goes straight to the visitor), abandoned-cart digest
  - Branded HTML + plain-text emails over SMTP; SMS through SSL Wireless or BulkSMSBD. Every message is logged in admin → Messages (secret links hidden), never sent twice, and a provider failure is recorded without affecting the order. Owners can send a test email/SMS from Settings.

### Admin panel (`/admin`, role-based)
| | Owner | Manager | Staff |
|---|:-:|:-:|:-:|
| Dashboard: sales today / 7 / 30 days, average order, 30-day chart, top products, orders to act on, low stock, open leads | ✓ | ✓ | ✓ |
| Orders: filters + search, CSV export, status changes, bKash/Nagad payment verification, courier + tracking, PDF invoice, internal notes | ✓ | ✓ | ✓ |
| Customers (guests included, grouped by phone) & cart leads, CSV export · contact messages · sent email/SMS log | ✓ | ✓ | ✓ |
| Products (photo upload + reorder, sizes/colours/stock, price overrides, SEO, duplicate, archive), categories, collections, coupons, delivery zones | ✓ | ✓ | view |
| Site settings, admin users, audit log | ✓ | | |

Every admin change is written to an audit log with before/after values, and storefront caches refresh immediately after an edit. Order statuses follow fixed transitions: cancelling restores stock and coupon use, a return can restock, and a COD order is marked paid when delivered.

### Quality
- Zod validation shared by client forms and server actions
- Rate limits on login, register, checkout, contact and password reset (MongoDB-backed, so they work across serverless instances)
- All user-written text sanitised before it is saved
- One error shape everywhere: `{ ok: false, error: { code, message, fields? } }`
- Loading and empty states on every page
- 89 Vitest tests against an in-memory MongoDB: pricing, cart and leads, coupons, checkout and payments, the admin order/product rules, and notifications (with mocked SMS gateways)
- Lighthouse (mobile, production build): Accessibility 100 and Best Practices 100 on every page tested; Performance 90–99; SEO 100 on public pages (cart, checkout, account and admin are noindex on purpose)
- WCAG AA colour contrast, labelled form fields with linked error messages, skip link, keyboard-usable menus, drawers and modals, reduced-motion support
- Security headers on every route (no framing, nosniff, strict referrer, HSTS in production), httpOnly session cookies, server-side role checks on every admin page, action and export

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router (Cache Components, Server Actions, `proxy.ts`), React 19, TypeScript |
| Styling | Tailwind CSS 4 with design tokens in `app/globals.css`; Playfair Display + Inter via `next/font` |
| Database | MongoDB with Mongoose 9 (works on local MongoDB or Atlas, no replica set required) |
| Auth | Custom session auth: bcrypt password hashes, hashed session tokens in an httpOnly cookie, TTL-indexed sessions |
| Validation | Zod 4 |
| Email / SMS | Adapters: `log` (development) or SMTP · `log`, SSL Wireless or BulkSMS BD |
| Payments | COD · SSLCommerz adapter (`mock` / `sandbox` / `live`) · bKash and Nagad manual verification |
| Tests | Vitest + mongodb-memory-server |
| Deploy | Vercel + MongoDB Atlas |

## Project structure

```
app/            routes: (store) storefront · admin/ panel · api/ payment callbacks, cron, exports
components/     ui/ primitives · store/ storefront · admin/ panel
server/         server-only code
  actions/      server actions (cart, checkout, auth, admin…)
  services/     business logic (pricing, stock, coupons, orders, leads, notifications)
  adapters/     email, SMS, payments, storage. Each one is swapped with an env var.
  auth/         sessions, password hashing, role permissions
models/         Mongoose models (User, Product, Variant, Category, Collection, Cart, Lead,
                Order + embedded OrderItem, Coupon, DeliveryZone, Setting, AuditLog, …)
lib/            client-safe helpers: money, validation schemas, BD geo data, i18n, sizes
data/           static copy and business details · seed/products.csv
scripts/        seed (+ demo data) and product image fetcher
tests/          Vitest suites
```

## Getting started

**Requirements:** Node.js 20+, and a MongoDB database (local `mongod` or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
git clone <repo-url> oxford-vale && cd oxford-vale
npm install
cp .env.example .env.local
```

Edit `.env.local` and set at least:

| Variable | Value |
|---|---|
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/oxford-vale` or your Atlas connection string |
| `SESSION_SECRET` | a long random string (`openssl rand -base64 48`) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | the owner account the seed creates (password: 8+ characters) |

Then:

```bash
npm run seed    # settings, admin users, categories, collections, 150 products, 677 variants, delivery zones, coupons
npm run seed -- --demo   # optional: 48 demo orders over 30 days, 12 open/abandoned carts, 2 messages
npm run dev     # http://localhost:3000 · admin at /admin
```

The seed is idempotent. Settings, stock, zones and coupons are only created when missing, but the CSV fields of seeded products (name, price, photos, collections) are re-applied on every run, so don't re-run the plain seed after editing products in the admin. `--fresh` rebuilds the catalog, `--limit 20` seeds a quick small catalog, and `--demo` / `--demo-clear` add or remove the demo orders without touching the catalog (demo records use `@demo.oxfordvale.example` emails).

### Product photos (optional)
To download free-licence product photos (2 per product, credited in `notes/image-credits.md`):

1. Get a free API key from [Pixabay](https://pixabay.com/api/docs/) (or Pexels / Unsplash) and add it to `.env.local` as `PIXABAY_API_KEY` (or `PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY`).
2. Run `npm run images`, then `npm run seed` to attach the photos.

Products without photos show a neutral placeholder.

### Demo accounts (after seeding)
| Role | Email | Password |
|---|---|---|
| Owner | `SEED_ADMIN_EMAIL` | `SEED_ADMIN_PASSWORD` |
| Manager | `manager@oxfordvale.example` | `SEED_DEMO_PASSWORD` (defaults to the admin password) |
| Staff | `staff@oxfordvale.example` | same as Manager |

Seeded coupons: `WELCOME10` (10% off orders over ৳3,000, once per customer) and `FLAT500` (৳500 off orders over ৳5,000).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run seed` | Seed the database (`--fresh`, `--limit N`, `--demo`, `--demo-clear`) |
| `npm run images` | Download product photos (`--only SKU,SKU`, `--force`, `--limit N`) |
| `npm run jobs:abandoned` | Mark idle carts as abandoned (same job as the cron route) |
| `npm test` | Run the Vitest suites |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |

## Mock vs real integrations

Every external service works out of the box in a mock mode, so every flow can be tested end to end without accounts:

| Service | Default | Switch to real |
|---|---|---|
| Email | `EMAIL_PROVIDER=log`: printed to the console and visible in admin → Messages | `smtp` + `SMTP_*`, then admin → Settings → Send test |
| SMS | `SMS_PROVIDER=log`: same, console + Messages | `sslwireless` (`SSLWIRELESS_*`) or `bulksmsbd` (`BULKSMSBD_*`) |
| SSLCommerz | `SSLCOMMERZ_MODE=mock`: built-in fake gateway page | `sandbox` (free developer store) or `live` + store ID/password |
| bKash / Nagad | Manual: the customer enters a transaction ID and an admin verifies it | No API needed |
| Image uploads | `STORAGE_PROVIDER=local` → `storage/uploads/`, served at `/uploads/…` | Vercel has no persistent disk: add a Cloudinary/S3 adapter in `server/storage.ts` |

The full list of variables, with comments, is in [`.env.example`](.env.example).

## Deploying (Vercel + Atlas)
1. Create a MongoDB Atlas cluster and allow access from Vercel (`0.0.0.0/0`, or Vercel's IP ranges).
2. Import the repo into Vercel and add the variables from `.env.example`. Set `APP_URL` to your Vercel domain.
3. Run `npm run seed` locally against the Atlas `MONGODB_URI` once.
4. Set `CRON_SECRET`. `vercel.json` already schedules `/api/cron/abandoned-carts` once a day (the Hobby plan limit); on Pro, change the schedule to `*/15 * * * *`.

## Running the store

### Where to change what
| To change | Where |
|---|---|
| Products, prices, stock, photos, sizes, SEO text | Admin → Products (Managers and Owners) |
| Categories, collections and their order (home "Best of" row = Best Sellers collection) | Admin → Categories / Collections |
| Coupons, delivery zones and fees | Admin → Coupons / Delivery zones |
| Store name, phone, WhatsApp, emails, address, hours, socials, announcement bar, hero and new-season text, free-delivery threshold, payment methods, bKash/Nagad numbers, invoice footer | Admin → Settings (Owner) |
| Admin staff and their roles | Admin → Admin users (Owner) |
| About, size guide, shipping, returns, privacy and terms text | `data/pages.ts` |
| Home category band order and lines | `data/home.ts` |
| Defaults used before Settings are saved (business details, legal IDs) | `data/site.ts` |
| Translations (English / Bangla UI) | `lib/i18n/en.ts`, `lib/i18n/bn.ts` |
| Colours and fonts | `app/globals.css` (`@theme` tokens), `app/layout.tsx` |

### Brand images
Put these in `public/brand/` with the exact names, then rebuild (or restart `npm run dev`). Stand-ins are included (hero cut-out from a free photo, the rest cut from product photos; credits in `notes/image-credits.md`). A file you add replaces the stand-in, and `npm run brand-assets` only fills files that are missing.

| File | Used on |
|---|---|
| `hero-model.png` (transparent cut-out, full or half body, ideally slim and about 1400px tall) | Home hero, in front of the wordmark |
| `new-season.jpg` | Home new-season banner |
| `cat-<slug>.jpg` (e.g. `cat-suits.jpg`) | Home category band (the path can be changed per category in admin) |
| `col-<slug>.jpg` (e.g. `col-heritage.jpg`, portrait) | Home collections mosaic (a collection image set in admin wins) |
| `shop-the-look.jpg` (portrait) | Home "Shop the look"; the outfit text and product list are in `data/home.ts` |
| `about-1.jpg`, `about-2.jpg` | About page |
| `og-image.jpg` (1200×630) | Link previews on WhatsApp / Facebook. A generated wordmark version is included: `npm run brand-assets` rebuilds it and the favicons |

### Where orders and messages appear
- `/admin` dashboard: today's sales, orders to confirm, bKash/Nagad payments to verify, orders to ship, low stock, open carts
- `/admin/orders`: every order, status changes, invoice PDF, CSV export
- `/admin/customers`: customers and cart leads (CSV export)
- `/admin/messages`: contact form messages and every email/SMS sent

### Environment variables
Names only; values and comments are in [`.env.example`](.env.example): `APP_URL` · `NEXT_PUBLIC_SITE_URL` · `MONGODB_URI` · `SESSION_SECRET` · `CRON_SECRET` · `SEED_ADMIN_EMAIL` · `SEED_ADMIN_PASSWORD` · `SEED_DEMO_PASSWORD` · `EMAIL_PROVIDER` · `EMAIL_FROM` · `SMTP_HOST` · `SMTP_PORT` · `SMTP_USER` · `SMTP_PASS` · `SMS_PROVIDER` · `SSLWIRELESS_API_TOKEN` · `SSLWIRELESS_SID` · `BULKSMSBD_API_KEY` · `BULKSMSBD_SENDER_ID` · `SSLCOMMERZ_MODE` · `SSLCOMMERZ_STORE_ID` · `SSLCOMMERZ_STORE_PASSWORD` · `STORAGE_PROVIDER` · `PIXABAY_API_KEY` · `PEXELS_API_KEY` · `UNSPLASH_ACCESS_KEY`

### Before going live
The open items (real business details, SMTP and SMS accounts, SSLCommerz live store, cloud image storage, removing demo data, real product photography) are listed in [`notes/missing.md`](notes/missing.md).

## Build progress
Built in seven stages; details of each are in [`PROGRESS.md`](PROGRESS.md).

| Stage | Status |
|---|---|
| 1. Setup, data models, seed | ✅ Done |
| 2. Storefront browsing | ✅ Done |
| 3. Cart and lead capture | ✅ Done |
| 4. Checkout, orders, accounts | ✅ Done |
| 5. Admin panel | ✅ Done |
| 6. Notifications | ✅ Done |
| 7. Polish | ✅ Done |

## Credits
- Bangladesh division / district / upazila data: [nuhil/bangladesh-geocode](https://github.com/nuhil/bangladesh-geocode) (MIT)
- Product photos: see `notes/image-credits.md` (Pixabay / Pexels / Unsplash licences)
- Fonts: Playfair Display and Inter (SIL Open Font License)
