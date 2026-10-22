# SME Website Starter

Lean Next.js (App Router) + Tailwind CSS template for small business websites. Copied into `clients/<slug>/` by the `new-client` skill. Replace this README with the client handover README at delivery.

## Run
```
npm install
cp .env.example .env.local
npm run dev     # http://localhost:3000
npm run build
```

## Where things live
| What | File |
|---|---|
| Business name, phone, WhatsApp, address, hours, socials, navbar | `data/site.ts` |
| Page titles, meta descriptions, hero and page copy | `data/pages.ts` |
| Services / offerings and prices | `data/services.ts` |
| Gallery photos | `data/gallery.ts` + `public/images/` |
| Privacy and Terms text | `data/legal.ts` |
| Colors and font tokens | `app/globals.css` (`@theme`) |
| Per-page SEO helper | `lib/seo.ts` → `buildMetadata("about")` |
| WhatsApp / call links | `lib/contact.ts` |
| Contact API (validation, optional MongoDB save) | `app/api/contact/route.ts` |

## Contact form
Validated on the server. On success the visitor is sent to WhatsApp with their message prefilled. Set `MONGODB_URI` to also save leads (`models/Lead.ts`). No email is sent.

## Notes
- Placeholders are marked `[PLACEHOLDER: …]`. Find them: `grep -rn PLACEHOLDER app data components`.
- Next.js 16: middleware is `proxy.ts`; `cacheComponents` is on — see `AGENTS.md` and `node_modules/next/dist/docs/`.
