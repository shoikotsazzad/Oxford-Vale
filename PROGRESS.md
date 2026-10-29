# Progress

Build order (notes/plan.md §8): 1 setup + seed → 2 storefront browsing → 3 cart + lead capture → 4 checkout + orders → 5 admin panel → 6 notifications → 7 polish.

## Step 1 — Setup + seed ✅ (2026-10-22)

### Done
- Dependencies: zod 4, bcryptjs, sanitize-html, nodemailer, server-only; dev: tsx, vitest, mongodb-memory-server, sharp
- Models (`models/`): User, Session, PasswordResetToken, Category, Collection, Product, Variant, Cart, Lead, Order (+ embedded OrderItem), Coupon, DeliveryZone, Setting, AuditLog, ContactMessage, NotificationLog, Counter, RateLimit
- `server/db.ts` cached connection · `server/auth/password.ts` · `server/services/catalog-sync.ts` (keeps product colours/sizes/minPrice/inStock in sync with variants)
- `lib/`: BDT formatting, slugify, size-range expansion, colour swatches, BD geo (8 divisions, 64 districts, 494 upazilas + 50 Dhaka city thanas), zod phone/email/name schemas
- `data/site.ts` filled with Oxford Vale details (from notes/client.md)
- Seed (`npm run seed`, idempotent): settings, owner + demo manager/staff, 11 categories, 6 collections, 150 products, 677 variants, 4 delivery zones (approved fees), coupons WELCOME10 / FLAT500
- Product photo script (`npm run images`): Pexels or Unsplash → 4:5 WebP → `public/products/<SKU>/`, credits in `notes/image-credits.md`
- Theme tokens + Playfair Display / Inter / Hind Siliguri (Bangla) fonts, root layout, temporary setup page at `/` showing live catalog and zone data
- `.env.example` complete, `.env.local` created for local MongoDB (secrets generated), README for GitHub
- Tests: 11 passing (size ranges, BDT format, phone validation, CSV integrity)
- `npm run build`, `npm run lint`, `npm test` all pass

### Mocked / pending
- Product photos: downloaded in step 3 (Pixabay)
- Brand photos (`public/brand/`): waiting for developer (list in notes/plan.md §7)
- Demo orders and leads for the dashboard (`seed --demo`): added in step 5 once the order service exists

## Step 2 — Storefront browsing ✅ (2026-10-22)

### Done
- Store layout: announcement bar, sticky header (category links, centred wordmark + tagline, search / language / account / wishlist / cart icons), "All" mega menu, slide-in mobile menu, footer, floating WhatsApp button, skip link
- Home: wordmark hero (model cut-out slot), black category band (5 cards), new-season split banner, 4-item feature bar, "Best of Oxford Vale" row (Best Sellers collection)
- Listings: `/shop`, `/shop/[category]`, `/collections/[slug]`, `/search` with size, colour and price filters, active-filter chips, 5 sort orders, pagination (24 per page), mobile filter drawer, empty states, skeletons
- Product page: swipeable gallery with thumbnails, colour selector (shown only when >1 colour), size selector with sold-out sizes disabled, stock status (low-stock warning from settings), quantity, details accordions (description, fabric, care, delivery), WhatsApp enquiry link, related products
- Live search suggestions (`/api/search/suggest`, debounced, keyboard navigable)
- Static pages: About, Contact (form saves to MongoDB with zod validation, sanitising, honeypot, 5/hour rate limit), Size Guide, Shipping Policy (live zone table), Returns, Privacy, Terms
- English / Bangla UI toggle (cookie + dictionaries in `lib/i18n/`, Hind Siliguri font for Bangla)
- SEO: per-page metadata, canonical URLs, sitemap with all products/categories/collections, robots, JSON-LD (ClothingStore, WebSite search, Product + Offer, BreadcrumbList)
- Caching: catalog and settings cached with `"use cache"` + tags (`catalog`, `settings`, `delivery-zones`) so admin edits can refresh them
- Shared server helpers: `server/result.ts` (one error shape), `server/rate-limit.ts` (MongoDB-backed), `server/sanitize.ts`
- Image script supports Pixabay (Pexels has paused new API keys)

### Mocked / pending
- Add to cart button validates size selection but does not add yet → step 3
- Header cart count fixed at 0 → step 3; wishlist heart links to the wishlist page → step 3/4 (needs accounts)
- Contact form saves messages; the admin email is sent from step 6 (notifications)
- Brand photos (hero model, category cards, new-season, about): fallbacks shown until files are added to `public/brand/`
- Policy details drafted (see notes/missing.md) need the developer's confirmation

## Step 3 — Cart + lead capture ✅ (2026-10-22)

### Done
- Server cart (`server/services/cart.ts`): random token in an httpOnly `ov_cart` cookie (30 days), no prices stored, live prices and stock on every view, quantity clamped / sold-out lines removed with a notice, max 10 per line, max 30 lines
- Pricing engine (`server/services/pricing.ts`, pure): unit price (variant override → sale → price), coupon discount (percent floored + capped, fixed ≤ subtotal), free delivery after discount, totals. Ready for checkout.
- Lead capture: first add-to-cart opens a modal (name, BD mobile, email; zod-validated, sanitised, rate-limited). "Skip, I'll add details at checkout" keeps the item and never asks again for that cart. Lead snapshot (items, value, last activity) refreshes on every cart change.
- Abandoned carts: leads idle past `abandonedAfterMinutes` (60) with items are marked `abandoned` once; activity revives them. Runs via `/api/cron/abandoned-carts` (Bearer `CRON_SECRET`, Vercel Cron daily in `vercel.json`) and `npm run jobs:abandoned`
- UI: cart context, header count, slide-in cart drawer (free-delivery progress, qty edit, remove), `/cart` page, add-to-cart on the product page with error messages
- Product photos: 300 Pixabay photos downloaded (2 per product), credited in notes/image-credits.md, attached by the seed
- Tests: 32 passing (pricing 10, cart + lead 11 against in-memory MongoDB)
- Browser check: size required → add → lead modal validation → save → drawer → second add skips modal → qty update on /cart → mobile skip flow

### Mocked / pending
- Admin digest email for abandoned carts → step 6 (sweep already returns the leads to notify)
- Vercel Hobby only allows a daily cron; on Pro set `*/15 * * * *`. The admin dashboard will also run the sweep on open (step 5).
- Some product photos are loose matches (Pixabay search); replace individual ones with `npm run images -- --force --only SKU` or real photography

## Step 4 — Checkout + orders + accounts ✅ (2026-10-22)

### Done
- Checkout `/checkout`: contact (lead saved at checkout start), Division → District → Upazila address with saved-address picker, live delivery zone + fee + ETA, coupon apply/remove, order note, optional account creation (guests) or save address (logged in), live server-side summary, rate limit 10/10 min
- Order placement (`server/services/order.ts`): totals recomputed from the DB, stock reserved atomically per line with rollback, coupon use claimed atomically, order number `OV-YYMMDD-NNNN` (Dhaka date), lead → converted, cart → converted
- Payments: Cash on Delivery · SSLCommerz adapter (`mock` built-in gateway page / `sandbox` / `live`, server-side validation, amount check, IPN, fail/cancel → retry or switch to COD) · bKash/Nagad manual (merchant number + amount, Trx ID + sender number, duplicate Trx ID blocked, "awaiting verification")
- Order page `/order/[orderNo]`: status steps, items, totals, payment badge, address, timeline, WhatsApp link, customer cancel while Pending (restores stock + coupon). Guests use a signed link (`?key=`); account owners need no key.
- Track order `/track-order`: order number + phone → order page
- Accounts: register, login (rate limited), logout, forgot/reset password (1-hour token, sessions revoked), `/account` overview + profile, orders + order detail, address book (add/edit/delete/default), wishlist (heart on every product card)
- Sessions: hashed random token in httpOnly cookie, 30-day TTL; `proxy.ts` redirects `/account/*` and `/admin/*` without a session; real checks in pages and actions
- Signed-in shoppers skip the lead modal (lead recorded from their profile); the bag is attached to the account on login
- Email/SMS adapter layer with `log` provider + NotificationLog (password reset email is logged)
- Tests: 59 passing (adds zone matching, coupons incl. atomic limit, checkout service: totals, price changes, coupons, stock conflict + rollback, free delivery, cancel, SSLCommerz mock validation, forged/mismatched payments)
- Browser check (desktop + mobile): validation, coupon, COD order + cancel, bKash Trx ID, SSLCommerz fail → retry → paid, order page blocked without key, track order, register, wishlist, address, logged-in checkout prefill

### Mocked / pending
- Order confirmation email + SMS, admin new-order email → step 6 (password reset email is already logged)
- Admin verifying bKash/Nagad payments, status updates, invoices → step 5
- SSLCommerz runs in `mock` mode; set `SSLCOMMERZ_MODE=sandbox` + free sandbox store credentials to use the real sandbox
- Several product photos are poor matches (e.g. Brown Leather Belt shows a woman with a sword; Gold Cufflinks shows a gold-painted face) → fix in step 7

## Step 5 — Admin panel ✅ (2026-10-22)

### Done
- `/admin` (noindex) with its own sign-in (admin roles only, rate limited), sidebar with pending-order / new-message badges, mobile drawer
- Roles (`server/auth/rbac.ts`): Staff = dashboard, orders, customers, messages, catalog view-only · Manager = + catalog, coupons, zones · Owner = + settings, admin users, audit log. Checked in every page (`requireAdminPage`), action (`adminAction`) and export route
- Dashboard: sales today / 7 / 30 days, average order, 30-day daily sales chart (hover + screen-reader table), top products, pending orders, payments to verify, orders to ship, new messages, low stock, open leads. Opening it (or the Leads tab) also runs the abandoned-cart sweep
- Orders: filters (status, payment, method, dates, search by order no / name / phone / Trx ID), CSV export, detail page with items, totals, customer (call / WhatsApp), delivery, timeline with who did what
  - Status machine (`server/services/order-admin.ts`): cancel restores stock + coupon use, Shipped needs a courier (tracking number optional, shown to the customer), Delivered marks COD paid, Returned can restock, Refunded only for paid orders. Conditional updates stop two admins overwriting each other
  - bKash/Nagad: Verify (→ paid + confirmed, records the admin) or Not received (clears the Trx ID so the customer can submit again, reason shown on their order)
  - PDF invoice (`@react-pdf/renderer`, amounts as "Tk" because the PDF font has no ৳ glyph), internal notes
- Products: list (search incl. variant SKU, category, status, low / sold-out stock), editor with photo upload (JPG/PNG/WebP ≤ 5 MB, re-encoded to 4:5 WebP, stored in `storage/uploads/`), reorder, alt text, sizes/colours/stock/price overrides with bulk "add sizes", automatic SKUs, SEO fields, collections, duplicate (draft, zero stock), archive/restore. Removed variants are deleted, or deactivated if they were ever ordered
- Categories, collections (search + ordered product list), coupons (live / scheduled / expired / used-up states, Dhaka dates), delivery zones (divisions, districts, areas checked against the BD geo list; the last fallback zone can't be deleted)
- Customers & leads: customers grouped by phone (guests included) with orders and spend; leads with cart contents, status, linked order; CSV exports for orders, customers and leads (formula-injection safe, UTF-8 BOM for Excel)
- Settings (owner): store, contact, hours, socials, announcement, hero, new-season banner, free-delivery threshold, abandoned minutes, low-stock level, payment methods + bKash/Nagad numbers, bank, invoice footer
- Admin users (owner): add, change role, deactivate, reset password; can't demote or deactivate yourself or the last owner; role changes sign the user out
- Audit log (owner): every admin change with before/after values, filter by area and person
- Messages: contact form inbox with status, and the log of every email/SMS sent (password reset links and order keys are redacted in the log)
- Every edit refreshes the storefront caches immediately (`updateTag`)
- `npm run seed -- --demo` / `--demo-clear`: 48 demo orders over 30 days, 12 open/abandoned carts, 2 messages, with stock and coupon use kept consistent
- Fixes found while testing: cancelled orders no longer show "verify payment"; dev hot reload now picks up model schema changes; enums split from mongoose so client components can import them
- Tests: 77 passing (adds RBAC, status machine, stock/coupon restore, payment verify/reject, product editor incl. variant ids and SKU conflicts, collections sync, duplicate, dashboard Dhaka-day sales, filters, customers, CSV)
- Browser check (desktop + mobile, no console errors or 5xx): login guard + rate limit, verify payment, confirm → process → ship → customer sees courier, notes, invoice PDF, CSV, create product with upload → store → archive, coupon validation, settings change shows in the store, staff view-only, no horizontal overflow on any admin page at 375px

### Mocked / pending
- Admin emails (new order, contact message, abandoned-cart digest) and customer order email/SMS → step 6
- Uploads use local disk: fine locally or on a VPS; Vercel needs a Cloudinary/S3 adapter in `server/storage.ts`
- Re-running the plain `npm run seed` re-applies CSV fields (price, photos, collections) to seeded products: don't run it after editing products in the admin

## Step 6 — Notifications ✅ (2026-10-22)

### Done
- Email adapter: `log` (console + log) or `smtp` (nodemailer, TLS on 465 / STARTTLS on 587, timeouts). SMS adapter: `log`, `sslwireless` (ISMS API v3) or `bulksmsbd`, numbers normalised to 8801XXXXXXXXX, 10 s timeout
- Events (`server/notifications/`), all run with `after()` so the shopper's request is never slowed or broken:
  - Order placed → customer email (branded HTML + text, items, totals, payment next step, order link) + SMS, admin email to Settings → orders email. Card orders wait for the gateway answer (paid → "order received, payment received"; failed/cancelled → retry or cash-on-delivery instructions)
  - Payment received (SSLCommerz after an earlier unpaid notice, or admin verifies bKash/Nagad) → customer email
  - Shipped → customer SMS + email with courier, tracking number and cash-to-keep-ready for COD
  - Contact form → admin email with reply-to set to the visitor
  - Abandoned carts → one admin digest (cron, `npm run jobs:abandoned`, or opening Dashboard / Leads); carts are claimed atomically so overlapping runs can't double-send, and a failed email releases them for the next run
  - Password reset email now also sends after the response (same timing whether or not the account exists)
- Every message is in NotificationLog with an event name: repeats (e.g. SSLCommerz success redirect + IPN) are skipped, failures are recorded with the provider's error, reset tokens and order keys are hidden
- Admin → Settings → Email & SMS: shows which providers are active and whether their credentials are set (never the values), sends a test email or SMS (rate limited, audited)
- SMS use "Tk" instead of ৳ so they stay in the cheaper 160-character GSM encoding
- Tests: 89 passing (adds templates, number format, de-duplication, provider failure + retry, SSL Wireless and BulkSMSBD requests with mocked HTTP, card-payment message choice, shipped message, abandoned digest claim/release)
- Browser check: COD order → customer email + SMS + admin email; contact form → admin email; admin ships → SMS + email; Settings test email; all visible in Messages → Sent with the order key hidden; no errors

### Mocked / pending
- Real sending needs accounts: an SMTP mailbox and an SSL Wireless or BulkSMSBD account (sender ID approval can take a few days). The SMS request formats follow the providers' public docs: send one test SMS from Settings before launch
- Customer messages are in English (Bangla SMS would use the Unicode rate: 70 characters per part)

## Step 7 — Polish ✅ (2026-10-23)

### Done
- Product photos re-fetched for all 150 products with a better matcher (`npm run images`): Pixabay fashion category, specific-to-general queries pooled per product, ranked by photo tags (garment synonyms like trousers → pants, men preferred; women, children, animals, food, artwork, shirtless rejected), unused photos before reused ones, download retries. `--any-category` for items Pixabay rarely files under fashion. Before: about half the photos showed the wrong subject (a cat, pizza, lions, a camel); now nearly all show a man in the right kind of garment
- Brand assets (`npm run brand-assets`): "OV" monogram favicon (`app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`) and a 1200×630 wordmark share image `public/brand/og-image.jpg` (the configured OG image was missing). Starter favicon and unused `public/images/og.svg` removed
- Brand photos that aren't in `public/brand/` yet are no longer requested (no 404s): the file list is read at build time in `next.config.ts`
- Accessibility: secondary text colour darkened from #7A746B to #6B655C (WCAG AA 4.5:1 on every background), footer and admin sidebar text contrast raised, cart icon name includes the visible count, heading order fixed on home and listing pages
- Security headers on every route (X-Frame-Options DENY, nosniff, strict referrer, permissions policy, HSTS in production), `X-Powered-By` removed
- SEO check: unique titles + descriptions on every public page, valid JSON-LD (ClothingStore, WebSite, BreadcrumbList, Product), sitemap with 177 URLs, robots. Metadata streams into the body for browsers and Googlebot (Next 16 default) and is in `<head>` for WhatsApp/Facebook link previews (verified)
- Lighthouse (mobile, production build): Accessibility 100 and Best Practices 100 on all 9 pages tested; Performance 90–99; SEO 100 on public pages (cart, checkout, search, account and admin are noindex by design)
- README: handover section (where to change what, brand image list, where orders appear, env var names, going-live pointer), quality results
- Secrets check: no keys or passwords in tracked files; `.env.local` is git-ignored

### Mocked / pending
- Product photos are free-licence stand-ins, not Oxford Vale products. Weak matches remain where Pixabay has little to offer (listed in notes/missing.md). Replace with real photography before launch
- Business details (licence numbers, bank, domain, orders email) are placeholders by design (notes/missing.md)

## Change request — home redesign and navigation (2026-10-23)

### Done
- Console warning fixed: `data-scroll-behavior="smooth"` on `<html>`
- "All" menu: opens on mouse hover (click still works for touch and keyboard), closes on scroll, outside click, Esc, moving the mouse away or changing page; light backdrop behind it
- Listing pages: a chip row of every category (shop and category pages) or every collection (collection pages) under the title, current one highlighted
- Home now matches design.jpg: cut-out model in front of the wordmark, photos in the category band and new-season banner (stand-ins, credited)
- New home sections: moving ticker, New arrivals carousel (New Season collection, arrow buttons), collections mosaic (Heritage, Winter Edit, Limited Edition), Shop the look (outfit photo + its 4 products + total), On sale now, WhatsApp size-help band. Sections fade up on scroll (CSS only; off for reduced motion)
- Home section config in `data/home.ts`; new strings in English and Bangla
- `npm run brand-assets` fills missing home photos with stand-ins and never overwrites real ones; the brand image credits survive `npm run images`

### Mocked / pending
- Home photos are stand-ins (see notes/missing.md → Brand photos)

## Change request — UK store, USD, light/dark mode (2026-10-28)

### Done
- Bag error fixed: adding to the bag while signed in to an account without a phone (e.g. the Owner) failed on the lead; leads now need a phone and never block the bag
- New-season photo (`new-season2.jpg`, kept top-aligned so the head stays in frame) and "Shop the look" photo (`The waistcoat.jpeg`) with matching products
- English only: Bangla toggle, dictionary and font removed
- Light/dark mode: header toggle (desktop + mobile menu), admin sidebar and admin login; follows the system until chosen, remembered in the browser, no flash on load. Dark palette is the same tokens redefined, every text pair checked for WCAG AA
- UK business details (placeholders from the developer): Savile Row address, 020 7946 / 0800 numbers, company and VAT numbers, UK hours, X added to socials, legal line in the footer, emails and invoices
- Currency: US dollars stored as integer cents; per-category price ladder (`scripts/seed/usd.ts`), sale discounts kept; admin money fields typed in dollars
- UK addresses (line 1/2, town, county, postcode validated + formatted, 232 countries) and phone numbers (UK mobile/landline or +country)
- Delivery options per country picked at checkout: UK Standard (free over $125), UK Next day ($8.95), Europe, Rest of the world; admin page rebuilt
- Payments: Stripe Checkout (cards, Amex, Apple Pay, Google Pay, Klarna) and PayPal over REST, mock pages until keys; server-side confirmation, amount + currency check, paid exactly once (return + webhook), signed Stripe webhook; pay page to retry or switch provider. COD, bKash, Nagad, SSLCommerz removed
- Email-only notifications (SMS removed); UK time (Europe/London) for order numbers, dashboard and dates; WhatsApp buttons replaced with call / email
- Page copy rewritten for the UK (about, contact, delivery, 30-day returns, UK GDPR privacy, terms under English law)
- Database converted in place with `npm run migrate:uk` (backup in `storage/backups/`): 150 products repriced, 49 orders + 61 leads converted (demo customers moved to UK addresses), coupons WELCOME10 / SAVE25, settings
- Checks: 95 tests, lint, type-check, production build compiles (stopped only by the Next.js security notice), end-to-end browser run: dollars everywhere, dark mode across pages, UK checkout with next-day delivery, Stripe mock paid, PayPal cancel then retry, invalid postcode rejected, US gets only rest-of-world, tracking by email, admin in dollars. No page errors

### Mocked / pending
- Stripe and PayPal run in mock mode until keys are added; three delivery fees are placeholders (notes/missing.md)
- Next.js 16.4.0 has critical advisories; upgrade to 16.4.3

## Open items
- [x] Step 5: admin panel
- [x] Step 6: notifications
- [x] Step 7: polish

## Change request 2026-10-29: app-style phones and tablets
- Below 1024px: fixed bottom tab bar (`components/store/MobileTabBar.tsx`): Home, Shop, Bag (opens the drawer, shows count), Wishlist, Account. Safe-area aware; hidden on checkout.
- Home on phones/tablets: greeting + search pill (`MobileWelcome`), rounded hero card, category tiles with "View all", compact section headings, offer card (`OfferCard`, coupon from `data/home.ts` → shown only while active in admin), "On sale" as list rows, "Best of" trimmed to 4 (phone) / 6 (tablet).
- Desktop (1024px+) unchanged.

## Change request 2026-10-29 (2): mobile polish, wishlist removed
- Phones/tablets: header shows only the wordmark and light/dark toggle; tab bar is Home, Shop, Search, Bag, Account.
- Smaller new-season banner, collections as a swipe row, shorter shop-the-look photo on small screens.
- Footer below lg: centred, essentials only (phone/email, key links, payment badges, socials, legal line). Desktop footer unchanged.
- Wishlist removed everywhere (product cards, header, tab bar, account page and nav, provider, server action, User.wishlist field). Existing wishlist data in MongoDB is simply ignored.
- Account pages: loading.tsx per segment fixes Next 16 "uncached data … outside <Suspense>" navigation errors.
