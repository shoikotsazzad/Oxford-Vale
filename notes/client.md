# Client: Oxford Vale (portfolio project)

All business details below were supplied by the developer for a portfolio demo. Items marked "placeholder" in the brief are not real.

Updated 2026-10-28: the brand moved to a UK setting (London, Savile Row), English only, prices in US dollars,
Stripe + PayPal payments. Details below are the developer's UK placeholders (fictional; safe for a portfolio).

## Business
- Brand: Oxford Vale — English heritage menswear (suits, blazers, outerwear, waistcoats, shirts, trousers, knitwear, ties, accessories, caps, shoes)
- Tagline: English heritage for a modern generation
- Legal name (invoices): Oxford Vale Menswear Ltd. (placeholder)
- Company registration no.: 00000000 (placeholder, Companies House format)
- VAT registration no.: GB 000 0000 00 (placeholder)
- Registered office: 14 Savile Row, London W1S 3PR (placeholder: real street, fictional number)
- Logo: none given (typographic wordmark)
- Legal footer: "Oxford Vale Menswear Ltd. is registered in England and Wales (company no. 00000000). Registered office: 14 Savile Row, London W1S 3PR. VAT no. GB 000 0000 00."

## Contact
- Customer care phone: 020 7946 0001 (Ofcom drama range, never a real number)
- Freephone: 0800 000 0001
- Email: hello@oxfordvale.example
- Support email: support@oxfordvale.example
- Orders email (admin notifications): orders@oxfordvale.example
- Website: www.oxfordvale.example
- No WhatsApp number given (WhatsApp buttons replaced by call / email)

## Location & hours (UK time, GMT/BST)
- Showroom and head office: 14 Savile Row, Mayfair, London W1S 3PR, United Kingdom
- Dispatch from: same address
- Hours: Monday to Friday 9:00 AM – 6:00 PM · Saturday 10:00 AM – 5:00 PM · Sunday and bank holidays closed

## Offerings
- 150 products in 11 categories: `notes/assets/products.csv` (original prices in BDT; the store shows US dollars via the per-category ladder in `scripts/seed/usd.ts`, approved 2026-10-28). Notes on sizes and images in `notes/brief.md`.

## Payments
- Accepted: Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, Klarna (Stripe Checkout + PayPal)
- Currency shown: USD (developer's choice for the portfolio), VAT included in displayed prices
- Bank account name: Oxford Vale Menswear Ltd.
- Sort code: 00-00-00 (placeholder) · Account no.: 00000000 (placeholder)
- Bank: Sample Bank, Mayfair branch (placeholder)

## Delivery and returns
- UK standard: 3–5 working days, free over $125 (brief: free over £100)
- UK next day: $8.95 (brief: £6.95), order before 2 PM
- International: Europe and rest of world, rates shown at checkout
- Returns: 30 days, free UK returns
- Invoice footer: "Thank you for shopping with Oxford Vale. For returns within 30 days, keep this invoice and contact support@oxfordvale.example."

## Socials
- Facebook: facebook.com/oxfordvale
- Instagram: instagram.com/oxfordvale
- X: x.com/oxfordvale
- YouTube: youtube.com/@oxfordvale

## Domain
- www.oxfordvale.example (placeholder)

## Language
- English default, optional Bangla toggle for UI labels

## Needs
- Full-stack e-commerce: catalog, cart, lead capture, checkout (COD, SSLCommerz sandbox, bKash/Nagad manual), orders, customer accounts, admin panel with roles, notifications. Full spec: `notes/brief.md`.

## Other
- Design reference: `notes/design/reference-evora-style-home.jpg` (layout/style only; brand is Oxford Vale, not Evora)
- Model/lifestyle images: developer will provide in `public/` (list in `notes/plan.md` §7)
- Product photos: Claude sources from free-licence sites
