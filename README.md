<div align="center">

# OXFORD VALE

**English heritage for a modern generation.**

A full-stack menswear e-commerce store for a London heritage brand: suits, outerwear, shirts, caps and shoes, priced in US dollars and paid by card, Apple Pay, Google Pay, Klarna (Stripe) or PayPal. Light and dark mode.

`Next.js 16` · `React 19` · `TypeScript` · `Tailwind CSS 4` · `MongoDB / Mongoose` · `Zod` · `Vitest`

</div>

---

> **Portfolio project.** Oxford Vale is a fictional brand. All business details (company and VAT numbers, bank details, domain) are placeholders; phone numbers use Ofcom's ranges reserved for drama. Payment and email integrations run in mock or test mode by default, and each one switches to a real provider with an environment variable.

## What it does

### Storefront
- Home page with a large typographic hero, a moving ticker, a category band, a new-arrivals carousel, a new-season banner, a collections mosaic, best sellers, "Shop the look", an on-sale row and a sizing-help band (sections fade in on scroll)
- Category and collection listings with a chip row to jump between categories, filters for size, colour and price range, sorting and pagination
- Product pages with an image gallery, size and colour selectors, live stock status, fabric and care notes, and related products
- Search with live suggestions
- A cart that is stored on the server and survives refreshes and devices (cookie token)
- Guest checkout with optional account creation
- Order confirmation, and order tracking by order number and email or phone
- Customer accounts: register, login, forgot/reset password, order history, saved addresses
- Light and dark mode on every page (follows the system setting until the visitor chooses; no flash on load), UK English

### UK store, worldwide delivery
- Prices in US dollars, stored as integer cents ($235, $8.95); VAT included, with a VAT line on UK invoices
- UK address form (address lines, town, county, postcode) with postcode validation and formatting (`sw1a1aa` → `SW1A 1AA`), plus international addresses; UK mobile and landline validation (`07700 900123`, `020 7946 0001`) or `+country` numbers
- Delivery options per country, chosen at checkout: UK Standard (free over $125), UK Next day, Europe, Rest of the world. All editable from admin.
- Payments: **Stripe Checkout** (Visa, Mastercard, Amex, Apple Pay, Google Pay, Klarna) and **PayPal**, both confirmed server-side (Stripe webhook + session lookup, PayPal capture) and marked paid exactly once
- Dates and "today" on the dashboard follow UK time (GMT/BST)

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
  - Customer: order confirmed (email, sent once the payment is confirmed; or a "finish paying" email if it wasn't), payment receipt, shipped with courier + tracking
  - Admin: new order, contact form message (reply goes straight to the visitor), abandoned-cart digest
  - Branded HTML + plain-text emails over SMTP with the UK company line in the footer. Every message is logged in admin → Messages (secret links hidden), never sent twice, and a provider failure is recorded without affecting the order. Owners can send a test email from Settings.

### Admin panel (`/admin`, role-based)
| | Owner | Manager | Staff |
|---|:-:|:-:|:-:|
| Dashboard: sales today / 7 / 30 days, average order, 30-day chart, top products, orders to act on, low stock, open leads | ✓ | ✓ | ✓ |
| Orders: filters + search (incl. awaiting payment), CSV export, status changes, courier + tracking, PDF invoice, internal notes | ✓ | ✓ | ✓ |
| Customers (guests included, grouped by phone) & cart leads, CSV export · contact messages · sent email log | ✓ | ✓ | ✓ |
| Products (photo upload + reorder, sizes/colours/stock, price overrides, SEO, duplicate, archive), categories, collections, coupons, delivery options | ✓ | ✓ | view |
| Site settings, admin users, audit log | ✓ | | |

Every admin change is written to an audit log with before/after values, and storefront caches refresh immediately after an edit. Order statuses follow fixed transitions: a paid order confirms itself, an unpaid one can only be cancelled, cancelling restores stock and coupon use, a return can restock, and refunds (issued in the Stripe or PayPal dashboard) are recorded on paid orders only.

### Quality
- Zod validation shared by client forms and server actions
- Rate limits on login, register, checkout, contact and password reset (MongoDB-backed, so they work across serverless instances)
- All user-written text sanitised before it is saved
- One error shape everywhere: `{ ok: false, error: { code, message, fields? } }`
- Loading and empty states on every page
- 95 Vitest tests against an in-memory MongoDB: pricing, cart and leads, coupons, checkout, delivery options, payments (mock links, amount/currency checks, paid-once, Stripe webhook signatures), the admin order/product rules, UK phones, postcodes and time, the dollar price ladder, and notifications
- Lighthouse (mobile, production build): Accessibility 100 and Best Practices 100 on every page tested; Performance 90–99; SEO 100 on public pages (cart, checkout, account and admin are noindex on purpose)
- WCAG AA colour contrast in both light and dark mode, labelled form fields with linked error messages, skip link, keyboard-usable menus, drawers and modals, reduced-motion support
- Security headers on every route (no framing, nosniff, strict referrer, HSTS in production), httpOnly session cookies, server-side role checks on every admin page, action and export

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router (Cache Components, Server Actions, `proxy.ts`), React 19, TypeScript |
| Styling | Tailwind CSS 4 with design tokens in `app/globals.css`; Playfair Display + Inter via `next/font` |
| Database | MongoDB with Mongoose 9 (works on local MongoDB or Atlas, no replica set required) |
| Auth | Custom session auth: bcrypt password hashes, hashed session tokens in an httpOnly cookie, TTL-indexed sessions |
| Validation | Zod 4 |
| Email | Adapters: `log` (development) or SMTP |
| Payments | Stripe Checkout and PayPal Orders v2 over their REST APIs (no SDKs): `mock` until keys are set, then test/sandbox or live |
| Tests | Vitest + mongodb-memory-server |
| Deploy | Vercel + MongoDB Atlas |

## Project structure

```
app/            routes: (store) storefront · admin/ panel · api/ payment callbacks, cron, exports
components/     ui/ primitives · store/ storefront · admin/ panel
server/         server-only code
  actions/      server actions (cart, checkout, auth, admin…)
  services/     business logic (pricing, stock, coupons, orders, leads, notifications)
  adapters/     email, payments (Stripe, PayPal, mock), storage. Each one is switched with env vars.
  auth/         sessions, password hashing, role permissions
models/         Mongoose models (User, Product, Variant, Category, Collection, Cart, Lead,
                Order + embedded OrderItem, Coupon, DeliveryZone, Setting, AuditLog, …)
lib/            client-safe helpers: money (cents), UK phones/postcodes/countries, UK time, theme, validation schemas, sizes
data/           static copy and business details · seed/products.csv
scripts/        seed (+ demo data), UK migration, product image fetcher
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
npm run seed    # settings, admin users, categories, collections, 150 products, 677 variants, delivery options, coupons
npm run seed -- --demo   # optional: 48 demo orders over 30 days, 12 open/abandoned carts, 2 messages
npm run dev     # http://localhost:3000 · admin at /admin
```

The seed is idempotent. Settings, stock, delivery options and coupons are only created when missing, but the CSV fields of seeded products (name, price, photos, collections) are re-applied on every run, so don't re-run the plain seed after editing products in the admin. `--fresh` rebuilds the catalog, `--limit 20` seeds a quick small catalog, and `--demo` / `--demo-clear` add or remove the demo orders without touching the catalog (demo records use `@demo.oxfordvale.example` emails).

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

Seeded coupons: `WELCOME10` (10% off orders over $100, once per customer) and `SAVE25` ($25 off orders over $200).

Product prices come from `data/seed/products.csv` (the client's original taka prices) through a per-category dollar ladder in `scripts/seed/usd.ts`, so every product keeps its place within its category.

**Upgrading an older database** (seeded before the UK switch): `npm run migrate:uk -- --dry-run`, then `npm run migrate:uk`. It converts prices, orders, leads, coupons, delivery options and settings in place, once.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run seed` | Seed the database (`--fresh`, `--limit N`, `--demo`, `--demo-clear`) |
| `npm run migrate:uk` | One-off: convert a pre-UK database (taka, BD addresses) to dollars and UK data (`--dry-run`) |
| `npm run brand-assets` | Favicons, share image, and stand-ins for missing home photos |
| `npm run images` | Download product photos (`--only SKU,SKU`, `--force`, `--limit N`) |
| `npm run jobs:abandoned` | Mark idle carts as abandoned (same job as the cron route) |
| `npm test` | Run the Vitest suites |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |

## Mock vs real integrations

Every external service works out of the box in a mock mode, so every flow can be tested end to end without accounts:

| Service | Default | Switch to real |
|---|---|---|
| Email | `EMAIL_PROVIDER=log`: printed to the console and visible in admin → Messages | `smtp` + `SMTP_*`, then admin → Settings → Send test |
| Stripe | No key: built-in test page (pay, decline or cancel) | `STRIPE_SECRET_KEY` (`sk_test_…` for test mode) + `STRIPE_WEBHOOK_SECRET`; turn on Apple Pay, Google Pay and Klarna in the Stripe dashboard |
| PayPal | No keys: built-in test page | `PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET` (sandbox by default, `PAYPAL_MODE=live` for real) |
| Image uploads | `STORAGE_PROVIDER=local` → `storage/uploads/`, served at `/uploads/…` | Vercel has no persistent disk: add a Cloudinary/S3 adapter in `server/storage.ts` |

The full list of variables, with comments, is in [`.env.example`](.env.example).

## Deploying (Vercel + Atlas)
1. Create a MongoDB Atlas cluster and allow access from Vercel (`0.0.0.0/0`, or Vercel's IP ranges).
2. Import the repo into Vercel and add the variables from `.env.example`. Set `APP_URL` to your Vercel domain.
3. Run `npm run seed` locally against the Atlas `MONGODB_URI` once.
4. In Stripe, add the webhook endpoint `https://<domain>/api/payments/stripe/webhook` (events in `.env.example`) and set `STRIPE_WEBHOOK_SECRET`.
5. Set `CRON_SECRET`. `vercel.json` already schedules `/api/cron/abandoned-carts` once a day (the Hobby plan limit); on Pro, change the schedule to `*/15 * * * *`.

## Running the store

### Where to change what
| To change | Where |
|---|---|
| Products, prices, stock, photos, sizes, SEO text | Admin → Products (Managers and Owners) |
| Categories, collections and their order (home "Best of" row = Best Sellers collection) | Admin → Categories / Collections |
| Coupons, delivery options, countries and fees | Admin → Coupons / Delivery options |
| Store name, company and VAT numbers, phone and freephone, emails, address, hours, socials, announcement bar, hero and new-season text, free-delivery threshold, Stripe/PayPal on or off, bank details, invoice footer | Admin → Settings (Owner) |
| Admin staff and their roles | Admin → Admin users (Owner) |
| About, size guide, shipping, returns, privacy and terms text | `data/pages.ts` |
| Home sections: category band, collections mosaic, "Shop the look" outfit and products | `data/home.ts` |
| Defaults used before Settings are saved (business details, legal IDs, payment brands) | `data/site.ts` |
| Dollar price ladder per category (seed and migration) | `scripts/seed/usd.ts` |
| UI labels (UK English) | `lib/i18n/en.ts` |
| Colours (light and dark) and fonts | `app/globals.css` (`@theme` tokens and the `[data-theme="dark"]` block), `app/layout.tsx` |

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
| `og-image.jpg` (1200×630) | Link previews on social apps and messengers. A generated wordmark version is included: `npm run brand-assets` rebuilds it and the favicons |

### Where orders and messages appear
- `/admin` dashboard: today's sales, pending orders, checkouts awaiting payment, orders to ship, low stock, open carts
- `/admin/orders`: every order, status changes, invoice PDF, CSV export
- `/admin/customers`: customers and cart leads (CSV export)
- `/admin/messages`: contact form messages and every email sent

### Environment variables
Names only; values and comments are in [`.env.example`](.env.example): `APP_URL` · `NEXT_PUBLIC_SITE_URL` · `MONGODB_URI` · `SESSION_SECRET` · `CRON_SECRET` · `SEED_ADMIN_EMAIL` · `SEED_ADMIN_PASSWORD` · `SEED_DEMO_PASSWORD` · `EMAIL_PROVIDER` · `EMAIL_FROM` · `SMTP_HOST` · `SMTP_PORT` · `SMTP_USER` · `SMTP_PASS` · `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` · `PAYPAL_CLIENT_ID` · `PAYPAL_CLIENT_SECRET` · `PAYPAL_MODE` · `STORAGE_PROVIDER` · `PIXABAY_API_KEY` · `PEXELS_API_KEY` · `UNSPLASH_ACCESS_KEY`

### Before going live
The open items (real business details, an SMTP account, Stripe and PayPal live keys, cloud image storage, removing demo data, real product and brand photography with cleared rights) are listed in [`notes/missing.md`](notes/missing.md).

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
| Home redesign, UK store (USD, Stripe/PayPal), light/dark mode | ✅ Done |

## Credits
- Product photos: see `notes/image-credits.md` (Pixabay / Pexels / Unsplash licences)
- Fonts: Playfair Display and Inter (SIL Open Font License)
