# Missing info

## Decisions (resolved 2026-10-22, see notes/plan.md §9)
- [x] Lead modal: skippable
- [x] Seed all 150 products
- [x] Delivery zones / free delivery ৳10,000 / abandoned after 60 min: approved
- [x] Keep 01700-00000x placeholder numbers

## Product photos
- [x] Pixabay photos downloaded (300) and attached
- [ ] All 300 photos were re-fetched in step 7 with tag-based matching; nearly all now show a man in the right kind of garment. Still weak (free libraries have little for these): pocket squares OV-TIE-008/009/010, some ties (OV-TIE-002, OV-TIE-006 show a statue), knitwear repeats one red jumper (OV-KNT-006/008/009), OV-KNT-007 #2, OV-TRS-007 (lederhosen), a few shirts shown as T-shirts (OV-SHR-013 to 016). Best fix: real product photography; or retry one with `npm run images -- --force --only SKU` (add `--any-category` for small accessories)

## Brand photos (developer provides in public/brand/ — list in notes/plan.md §7)
Stand-ins are in place for the home page (2026-10-23); replace with real brand photography before launch:
- [ ] hero-model.png (cut-out) — home hero. **Must replace before publishing:** currently cut from `public/brand/clian.jpeg`, a still of actor Cillian Murphy from *Peaky Blinders* (copyrighted, real person's likeness, no licence). Use a licensed or AI-generated model, or our own photo shoot
- [ ] new-season.jpg — home banner (stand-in from a product photo)
- [ ] cat-suits / cat-outerwear / cat-accessories / cat-caps / cat-shoes — category strip (stand-ins from product photos)
- [ ] col-heritage / col-winter-edit / col-limited-edition — collections mosaic (stand-ins from product photos)
- [ ] shop-the-look.jpg — home "Shop the look" (stand-in from a product photo; pick the matching products in data/home.ts)
- [ ] about-1.jpg, about-2.jpg — about page
- [ ] auth-side.jpg (optional) — login/register

## Content
- [ ] Size guide measurements (chest/waist/shoe charts) — size guide page (standard UK/EU charts used if none)
- [ ] Returns policy details beyond "14 days" — returns policy page
- [ ] About story text — about page (written from brand positioning if none)
- [ ] Coupon codes to seed (samples WELCOME10, FLAT500 proposed)

## Integrations (mocked until provided)
- [ ] SSLCommerz sandbox store ID + password (mock gateway used until then)
- [ ] SMTP credentials (emails logged until then)
- [ ] SMS provider API key (SMS logged until then)
- [ ] MongoDB URI (developer connects their own; local mongod used for development) + domain for deploy

## Policy details drafted (confirm or change in data/pages.ts)
- [ ] Shipping: orders before 5 PM processed same day; Friday/holiday orders next working day
- [ ] Returns: faulty/wrong items reported within 48 hours; delivery fee non-refundable unless faulty; sale items exchange-only for size
- [ ] Terms: prices include VAT; one coupon per order
- [ ] Size guide: standard UK/EU charts (replace with brand measurements if available)

## Before going live (from step 5)
- [ ] Image uploads: `STORAGE_PROVIDER=local` writes to `storage/uploads/`. Vercel has no persistent disk, so pick Cloudinary or S3 (credentials needed) — admin → product photos
- [ ] Remove demo data before launch: `npm run seed -- --demo-clear`
- [ ] Courier list: the shipped form takes any courier name (e.g. Pathao, Steadfast, RedX); confirm which couriers the shop uses

## Before going live (from step 6)
- [ ] SMTP mailbox for sending (host, port, user, password, from address) → `.env` `SMTP_*`, `EMAIL_FROM`
- [ ] SMS account: SSL Wireless (API token + SID) or BulkSMSBD (API key + approved sender ID) → `.env`; send a test from admin → Settings
- [ ] Orders email that receives new-order and abandoned-cart alerts (admin → Settings → Contact; currently orders@oxfordvale.example placeholder)
- [ ] Customer messages are English only; say if Bangla SMS/emails are wanted (Bangla SMS cost more per message)
