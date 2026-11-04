# Missing info

## Decisions (resolved 2026-10-22, see notes/plan.md §9)
- [x] Lead modal: skippable
- [x] Seed all 150 products
- [x] Delivery zones / free delivery / abandoned after 60 min: approved (now UK options, free over $125)
- [x] UK placeholder details supplied 2026-10-28 (Ofcom drama-range phone numbers)
- [x] Currency: USD; price ladder per category approved 2026-10-28

## Product photos
- [x] Pixabay photos downloaded (300) and attached
- [ ] All 300 photos were re-fetched in step 7 with tag-based matching; nearly all now show a man in the right kind of garment. Still weak (free libraries have little for these): pocket squares OV-TIE-008/009/010, some ties (OV-TIE-002, OV-TIE-006 show a statue), knitwear repeats one red jumper (OV-KNT-006/008/009), OV-KNT-007 #2, OV-TRS-007 (lederhosen), a few shirts shown as T-shirts (OV-SHR-013 to 016). Best fix: real product photography; or retry one with `npm run images -- --force --only SKU` (add `--any-category` for small accessories)

## Brand photos (developer provides in public/brand/ — list in notes/plan.md §7)
Stand-ins are in place for the home page (2026-10-23); replace with real brand photography before launch:
- [ ] hero-model.png (cut-out) — home hero. **Must replace before publishing:** currently cut from `public/brand/clian.jpeg`, a still of actor Cillian Murphy from *Peaky Blinders* (copyrighted, real person's likeness, no licence). Use a licensed or AI-generated model, or our own photo shoot
- [ ] new-season.jpg — home banner. Supplied by the developer (from new-season2.jpg); confirm the image rights before publishing
- [ ] cat-suits / cat-outerwear / cat-accessories / cat-caps / cat-shoes — category strip (stand-ins from product photos)
- [ ] col-heritage / col-winter-edit / col-limited-edition — collections mosaic (stand-ins from product photos)
- [ ] shop-the-look.jpg — home "Shop the look". Supplied by the developer (from The waistcoat.jpeg, 525×650, a little small); confirm the image rights before publishing
- [ ] about-1.jpg, about-2.jpg — about page
- [ ] auth-side.jpg (optional) — login/register

## Content
- [ ] Size guide measurements (chest/waist/shoe charts) — size guide page (standard UK/EU charts used if none)
- [ ] Returns policy details beyond "30 days, free UK returns" — returns policy page
- [ ] About story text — about page (written from brand positioning if none)
- [ ] Coupon codes to seed (samples WELCOME10 and SAVE25)

## Integrations (mocked until provided)
- [ ] Stripe test key (`sk_test_…`) + webhook secret; Apple Pay / Google Pay / Klarna switched on in the Stripe dashboard (mock page used until then)
- [ ] PayPal sandbox client ID + secret (mock page used until then)
- [ ] SMTP credentials (emails logged until then)
- [ ] MongoDB URI (developer connects their own; local mongod used for development) + domain for deploy

## Policy details drafted (confirm or change in data/pages.ts)
- [ ] Delivery fees not in the brief (placeholders): UK Standard $5.95 under $125, Europe $19.95 (4–8 days), Rest of the world $34.95 (7–14 days) — admin → Delivery options
- [ ] Shipping: processed Mon–Fri; next-day orders before 2 pm dispatched same day; duties paid by international recipients
- [ ] Returns: 30 days, free UK returns via a returns label or the showroom; refunds within 14 days; whole-order returns refund standard delivery
- [ ] Privacy: UK GDPR wording, ICO complaints; Terms: law of England and Wales; prices in USD including VAT; one coupon per order
- [ ] Size guide: standard UK/EU charts (replace with brand measurements if available)

## Before going live (from step 5)
- [ ] Image uploads: `STORAGE_PROVIDER=local` writes to `storage/uploads/`. Vercel has no persistent disk, so pick Cloudinary or S3 (credentials needed) — admin → product photos
- [ ] Remove demo data before launch: `npm run seed -- --demo-clear`
- [ ] Courier list: the shipped form takes any courier name (e.g. Royal Mail, DPD, DHL); confirm which couriers the shop uses

## Before going live (from step 6)
- [ ] SMTP mailbox for sending (host, port, user, password, from address) → `.env` `SMTP_*`, `EMAIL_FROM`
- [ ] Orders email that receives new-order and abandoned-cart alerts (admin → Settings → Contact; currently orders@oxfordvale.example placeholder)
- [x] SMS removed (email only) and Bangla removed (English only), 2026-10-28

## UK switch (2026-10-28)
- [x] Existing database converted in place (`npm run migrate:uk`); backup before the change: `storage/backups/oxford-vale-before-uk-2026-10-28.archive` (restore: `mongorestore --gzip --archive=… --drop`)
- [ ] The one pre-switch test order (OV-261028-0001) keeps its Bangladesh address (country BD) and is now an unpaid Stripe order; cancel it from admin if not needed
- [x] Upgraded Next.js to 16.4.4 (critical security advisories; the build stopped with a SecurityFatalError notice on 16.4.0)
