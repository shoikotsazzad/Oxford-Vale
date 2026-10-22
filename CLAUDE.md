# Oxford Vale — Website

## Skills
- Process: `sme-core`
- Industry: `sme-ecommerce` (also `sme-clothing-boutique` for size guide and fabric/fit copy)
On "continue" or any build request: follow sme-core workflow from step 1, but the brief's working method below takes priority.
Next.js version rules: @AGENTS.md

## Scope
Full spec: `notes/brief.md` (source of truth). Approved structure and models: `notes/plan.md`. Products: `notes/assets/products.csv`.
Portfolio project: every flow must work end to end; real integrations are mocked or sandboxed behind env vars.

## Client
- Name: Oxford Vale (legal: Oxford Vale Menswear Ltd. — placeholder)
- Industry: ecommerce (menswear)
- Phone: 01700-000001 · WhatsApp: 01700-000002 · Email: hello@oxfordvale.example · Orders: orders@oxfordvale.example
- Address: House 12, Road 27, Block A, Gulshan 1, Dhaka 1212, Bangladesh
- Language: English default + Bangla UI toggle
- Full details: `notes/client.md` · Missing items: `notes/missing.md`

## Pages
Storefront: Home `/` · Shop `/shop` (+ `/shop/[category]`, `/collections/[slug]`) · Product `/product/[slug]` · Search `/search` · Cart `/cart` · Checkout `/checkout` (+ `/checkout/pay/[orderNo]`) · Order `/order/[orderNo]` · Track `/track-order` · Account `/account/*` (login, register, forgot/reset password, orders, addresses, wishlist)
Static: About · Contact · Size Guide · Shipping Policy · Returns Policy · Privacy · Terms
Navbar: Suits · Outerwear · Shirts · Accessories · Caps · Shoes (+ "All" menu). Header icons: search, account, wishlist, cart (count).
Admin `/admin` (noindex, roles Owner/Manager/Staff): dashboard, products, categories, collections, orders, customers & leads, coupons, delivery zones, settings, users, audit log, messages.

## Design
Reference: `notes/design/reference-evora-style-home.jpg` (layout/style only; brand is Oxford Vale).
- Colors: bg `#F7F5F0` · text and buttons `#111111` · charcoal panels (e.g. `#1E1E1E`, category band near-black) · warm grey secondary text (e.g. `#7A746B`) · one muted accent for sale badges only (e.g. oxblood `#7A2E2A`). Confirm exact values on first build.
- Fonts: Playfair Display for headings and the wordmark (high contrast, large); Inter for body/UI. Small uppercase tracked labels for nav, eyebrows and buttons.
- Spacing: container `max-w-7xl`, sections `py-16 md:py-20`, tight product grid gap (16px), generous hero.
- Shape: buttons `rounded-md` (pill-ish black primary, outlined secondary) with arrow icon; cards with small radius (`rounded-lg`), no heavy shadows; category band `rounded-2xl` black.
- Layout: header = category links left, centered wordmark with small tagline, icon links right (search, account, wishlist, cart). Hero = huge "OXFORD VALE" wordmark with the cut-out model in front of it, tagline top-left, "Shop Now" + "Explore Collection" bottom-left, "New collection" note right. Black category band with 4–5 image cards (title, line, "Shop" pill). New-season split banner (serif headline left, photo right). 4-item feature bar with line icons and dividers. "Best of" product row (5 columns desktop, 2 mobile) with hover image swap, wishlist heart, name + ৳ price.

## Status
- Stage: new — step 1 proposal written, **awaiting developer approval** (`notes/plan.md` §9 has 4 open decisions)
- Done: project setup, brief, product CSV, design reference saved
- Pending: approval → build steps 1–7 (plan §8)
- Placeholders open: business IDs, bank details, domain (all placeholders by design); developer-provided brand photos

## Working method (from brief)
- Do not write code until the developer approves `notes/plan.md`.
- Build order: setup + seed → storefront browsing → cart + lead capture → checkout + orders → admin panel → notifications → polish.
- After each step: run the app, report what works and what is mocked, update `PROGRESS.md` and this Status section.
- Keep `.env.example` complete and the README setup steps current.

## Rules
- Only edit files in this folder.
- Do not copy content from other clients.
- Never invent phone numbers, addresses, prices or reviews. No customer reviews or ratings on the site.
- Product photos: free-licence sources only, downloaded locally, credited in `notes/image-credits.md`.
- Do not git commit; the developer commits.
