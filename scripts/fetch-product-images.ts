// npm run images [-- --force] [-- --only OV-SUT-001,OV-SUT-002] [-- --limit 20] [-- --any-category]
// Downloads two free-licence photos per product (main + hover) from Pixabay, Pexels or Unsplash,
// crops them to 4:5 WebP in public/products/<SKU>/ and records every photo in notes/image-credits.md.
// Needs PIXABAY_API_KEY, PEXELS_API_KEY or UNSPLASH_ACCESS_KEY in .env.local. Products that already have photos are skipped.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { loadEnvConfig } from "@next/env";
import { readProductsCsv, type CsvProduct } from "./seed/csv";

loadEnvConfig(process.cwd());

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "products");
const CREDITS = path.join(ROOT, "notes", "image-credits.md");
const CREDITS_JSON = path.join(ROOT, "notes", "image-credits.json");
const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const FORCE = args.includes("--force");
const ANY_CATEGORY = args.includes("--any-category"); // for items Pixabay rarely files under fashion (wallets, pocket squares)
const ONLY = opt("only")?.split(",").map((s) => s.trim());
const LIMIT = Number(opt("limit") ?? Infinity);
const PER_PRODUCT = 2;

type Photo = { id: string; source: "pixabay" | "pexels" | "unsplash"; url: string; page: string; author: string; authorUrl: string; downloadPing?: string; tags?: string[] };
type Credit = Photo & { sku: string; file: string; query: string; licence: string };

// Most specific first. The first match decides the search noun.
const NOUNS: [RegExp, string][] = [
  [/tuxedo shirt|dress shirt|evening dress shirt/i, "white dress shirt"],
  [/tuxedo|dinner suit|dinner jacket/i, "tuxedo"],
  [/three-piece/i, "three piece suit"],
  [/suit/i, "suit"],
  [/biker/i, "leather biker jacket"],
  [/bomber/i, "bomber jacket"],
  [/harrington/i, "harrington jacket"],
  [/field jacket|military/i, "field jacket"],
  [/gilet|quilted down|puffer/i, "puffer jacket"],
  [/suede jacket|car coat/i, "suede jacket"],
  [/sports coat|tweed jacket|blazer/i, "blazer"],
  [/trench|mac|raincoat|rain mac/i, "trench coat"],
  [/peacoat|donkey jacket/i, "peacoat"],
  [/duffle/i, "duffle coat"],
  [/parka/i, "parka"],
  [/windbreaker/i, "windbreaker jacket"],
  [/waxed/i, "waxed jacket"],
  [/shearling/i, "shearling coat"],
  [/overcoat|topcoat|wool coat|tweed coat|caped/i, "overcoat"],
  [/waistcoat|vest/i, "waistcoat"],
  [/polo/i, "polo shirt"],
  [/henley/i, "henley shirt"],
  [/hawaiian|resort/i, "hawaiian shirt"],
  [/shirt/i, "shirt"],
  [/jeans/i, "jeans"],
  [/chino/i, "chinos"],
  [/cargo/i, "cargo pants"],
  [/jogger/i, "joggers"],
  [/corduroy trousers|moleskin/i, "corduroy trousers"],
  [/trousers/i, "trousers"],
  [/turtleneck/i, "turtleneck"],
  [/cardigan/i, "cardigan"],
  [/zip/i, "zip sweater"],
  [/aran|fisherman|cable/i, "cable knit sweater"],
  [/sweater|jumper|v-neck/i, "sweater"],
  [/bow tie/i, "bow tie"],
  [/pocket square/i, "pocket square"],
  [/tie/i, "necktie"],
  [/belt/i, "leather belt"],
  [/cufflinks/i, "cufflinks"],
  [/scarf/i, "scarf"],
  [/briefcase/i, "leather briefcase"],
  [/weekender|bag/i, "duffel bag"],
  [/wallet|card holder|passport/i, "leather wallet"],
  [/gloves/i, "leather gloves"],
  [/pocket watch/i, "pocket watch"],
  [/sunglasses/i, "sunglasses"],
  [/umbrella/i, "umbrella"],
  [/fedora|trilby/i, "fedora hat"],
  [/panama/i, "panama hat"],
  [/beanie/i, "beanie"],
  [/cap/i, "flat cap"],
  [/chelsea/i, "chelsea boots"],
  [/desert boots|boots/i, "leather boots"],
  [/loafers/i, "loafers"],
  [/sneakers/i, "white sneakers"],
  [/brogue|wingtip/i, "brogues"],
  [/monk/i, "monk strap shoes"],
  [/shoes/i, "leather shoes"],
];

const MODEL_SHOT = new Set(["Suits", "Blazers", "Outerwear", "Waistcoats", "Shirts", "Trousers", "Knitwear", "Caps"]);

const nounFor = (p: CsvProduct) => NOUNS.find(([re]) => re.test(p.name))?.[1] ?? p.category.toLowerCase();
const colourFor = (p: CsvProduct) => (["Print", "Multi", "Black/White"].includes(p.colour) ? "" : p.colour.toLowerCase().replace(/ check| stripe/, ""));

/** Queries from most to least specific; results are pooled and ranked by tags. */
function queriesFor(p: CsvProduct) {
  const noun = nounFor(p), colour = colourFor(p), who = MODEL_SHOT.has(p.category) ? "man" : "";
  return [...new Set([[who, colour, noun], [who, noun], [noun]].map((q) => q.filter(Boolean).join(" ")))];
}

// Tag scoring (Pixabay returns tags): the garment must be tagged; people other than men, animals and food are out.
const REJECT = /\b(wom[ae]n|girls?|female|lady|ladies|bride|child|children|kids?|baby|toddler|dog|puppy|cat|kitten|animal|lion|camel|bird|food|pizza|drink|fruit|flower|dress|henna|mehndi|bangles?|bracelet|necklace|earrings?|makeup|shirtless|topless|naked|nude|bikini|mask|statue|sculpture|graffiti|abstract|pattern|lederhosen|heels?)\b/;
// Tag words that count as the garment (Pixabay tags vary: trousers are usually "pants").
const SYNONYMS: Record<string, string[]> = {
  trousers: ["trousers", "pants", "slacks"], chinos: ["chinos", "chino", "pants"], jeans: ["jeans", "denim"], "cargo pants": ["cargo", "pants"],
  waistcoat: ["waistcoat", "vest"], sweater: ["sweater", "pullover", "jumper", "knitwear"], "cable knit sweater": ["sweater", "knit", "pullover"],
  turtleneck: ["turtleneck", "sweater"], cardigan: ["cardigan"], "zip sweater": ["sweater", "pullover"],
  necktie: ["tie", "necktie"], "bow tie": ["bow tie", "bowtie"], "pocket square": ["pocket square", "handkerchief"],
  overcoat: ["overcoat", "coat"], "trench coat": ["trench", "coat", "raincoat"], peacoat: ["peacoat", "coat"], "duffle coat": ["duffle", "coat"], "shearling coat": ["shearling", "coat"],
  "puffer jacket": ["puffer", "down jacket", "jacket"], "flat cap": ["flat cap", "cap", "beret"], "leather boots": ["boots", "boot"], "chelsea boots": ["boots", "chelsea"],
  "leather shoes": ["shoes", "shoe"], brogues: ["shoes", "brogues", "oxford"], loafers: ["loafers", "shoes"], "monk strap shoes": ["shoes"], "white sneakers": ["sneakers", "shoes"],
};
const garmentWords = (noun: string) => SYNONYMS[noun] ?? [noun.split(" ").pop()!.replace(/s$/, "")];
const MEN = /\b(man|men|male|businessman|gentleman|guy|boy)\b/;
function score(photo: Photo, p: CsvProduct) {
  if (!photo.tags) return 1; // providers without tags keep their own ranking
  const tags = photo.tags.join(" ").toLowerCase();
  const noun = nounFor(p);
  if (REJECT.test(tags.replace(/dress shirt/g, ""))) return -1;
  const words = garmentWords(noun);
  if (!words.some((w) => tags.includes(w))) return 0;
  if (words.includes("shirt") && !tags.replace(/t-?shirt/g, "").includes("shirt")) return 0; // a T-shirt isn't a shirt
  return 3 + (MEN.test(tags) ? 2 : 0) + (colourFor(p) && tags.includes(colourFor(p).split(" ")[0]) ? 1 : 0);
}

async function searchPixabay(query: string): Promise<Photo[]> {
  // Fashion category + vertical; paced to stay under Pixabay's 100 requests per minute.
  await new Promise((r) => setTimeout(r, 700));
  const url = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo${ANY_CATEGORY ? "" : "&category=fashion"}&orientation=vertical&per_page=100&safesearch=true`;
  const res = await fetchRetry(url);
  if (!res.ok) throw new Error(`Pixabay ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { hits: { id: number; pageURL: string; largeImageURL: string; user: string; user_id: number; tags: string }[] };
  return json.hits.map((p) => ({
    id: `pixabay-${p.id}`, source: "pixabay", url: p.largeImageURL, page: p.pageURL, author: p.user, authorUrl: `https://pixabay.com/users/${p.user}-${p.user_id}/`,
    tags: p.tags.split(",").map((t) => t.trim().toLowerCase()),
  }));
}

async function searchPexels(query: string): Promise<Photo[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY! } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { photos: { id: number; url: string; photographer: string; photographer_url: string; src: { large2x: string } }[] };
  return json.photos.map((p) => ({
    id: `pexels-${p.id}`, source: "pexels", url: p.src.large2x, page: p.url, author: p.photographer, authorUrl: p.photographer_url,
  }));
}

async function searchUnsplash(query: string): Promise<Photo[]> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&orientation=portrait&content_filter=high`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`, "Accept-Version": "v1" } });
  if (!res.ok) throw new Error(`Unsplash ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    results: { id: string; urls: { raw: string }; links: { html: string; download_location: string }; user: { name: string; links: { html: string } }; premium?: boolean; plus?: boolean }[];
  };
  return json.results
    .filter((p) => !p.premium && !p.plus) // Unsplash+ photos are not free
    .map((p) => ({
      id: `unsplash-${p.id}`, source: "unsplash", url: `${p.urls.raw}&w=1200&q=80&fm=jpg`, page: p.links.html,
      author: p.user.name, authorUrl: p.user.links.html, downloadPing: p.links.download_location,
    }));
}

/** fetch with a timeout and 3 attempts: image CDNs and APIs drop connections now and then. */
async function fetchRetry(url: string, init: RequestInit = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
    } catch (err) {
      if (attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

const LICENCE = { pixabay: "Pixabay Content License (free to use, no attribution required)", pexels: "Pexels License (free to use, no attribution required)", unsplash: "Unsplash License (free to use)" };

async function saveWebp(photo: Photo, file: string) {
  const res = await fetchRetry(photo.url);
  if (!res.ok) throw new Error(`Download failed ${res.status} for ${photo.page}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await sharp(buf).resize(1000, 1250, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toFile(file);
  // Unsplash API guidelines: register the download.
  if (photo.downloadPing) {
    await fetch(photo.downloadPing, { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }).catch(() => {});
  }
}

function writeCredits(credits: Credit[]) {
  writeFileSync(CREDITS_JSON, JSON.stringify(credits, null, 2) + "\n");
  const lines = [
    "# Image credits",
    "",
    "Product photos downloaded by `npm run images` from free-licence sources. Generated file: edit `image-credits.json` or rerun the script.",
    "Photos are the closest available match by garment type and colour, not photos of the actual Oxford Vale products. Replace with real product photography before launch.",
    "",
    "| SKU | File | Photographer | Source | Licence |",
    "|---|---|---|---|---|",
    ...credits
      .sort((a, b) => a.file.localeCompare(b.file))
      .map((c) => `| ${c.sku} | \`public/products/${c.file}\` | [${c.author.replace(/\|/g, "")}](${c.authorUrl}) | [${c.source}](${c.page}) | ${c.licence} |`),
    "",
  ];
  // Keep the hand-written brand images section (hero, banners) that follows the product table.
  const existing = existsSync(CREDITS) ? readFileSync(CREDITS, "utf8") : "";
  const brand = existing.indexOf("## Brand images");
  writeFileSync(CREDITS, lines.join("\n") + (brand >= 0 ? "\n" + existing.slice(brand) : ""));
}

async function main() {
  const provider = process.env.PIXABAY_API_KEY ? "pixabay" : process.env.PEXELS_API_KEY ? "pexels" : process.env.UNSPLASH_ACCESS_KEY ? "unsplash" : null;
  if (!provider) {
    console.error("Set PIXABAY_API_KEY (free: https://pixabay.com/api/docs/), PEXELS_API_KEY or UNSPLASH_ACCESS_KEY in .env.local.");
    process.exitCode = 1;
    return;
  }
  const search = { pixabay: searchPixabay, pexels: searchPexels, unsplash: searchUnsplash }[provider];

  const credits: Credit[] = existsSync(CREDITS_JSON) ? JSON.parse(readFileSync(CREDITS_JSON, "utf8")) : [];
  // With --force, the photos of the products being replaced are free to be picked again.
  const replacing = new Set(FORCE ? (ONLY ?? readProductsCsv(path.join(ROOT, "data/seed/products.csv")).map((p) => p.sku)) : []);
  const used = new Set(credits.filter((c) => !replacing.has(c.sku)).map((c) => c.id));
  const cache = new Map<string, Photo[]>();

  let products = readProductsCsv(path.join(ROOT, "data/seed/products.csv"));
  if (ONLY) products = products.filter((p) => ONLY.includes(p.sku));
  products = products.filter((p) => {
    const dir = path.join(OUT, p.sku);
    return FORCE || !existsSync(dir) || readdirSync(dir).filter((f) => f.endsWith(".webp")).length < PER_PRODUCT;
  });
  products = products.slice(0, LIMIT);
  console.log(`${provider}: fetching photos for ${products.length} products`);

  let done = 0;
  for (const p of products) {
    const queries = queriesFor(p);
    const query = queries[0];
    try {
      const pool = new Map<string, Photo>();
      for (const q of queries) {
        if (!cache.has(q)) cache.set(q, await search(q));
        for (const c of cache.get(q)!) if (!pool.has(c.id)) pool.set(c.id, c);
      }
      // Tiers: unused match > reused match > unused untagged (providers without tags). Off-topic photos are never used.
      const tier = (c: Photo) => { const sc = score(c, p); return sc >= 3 ? (used.has(c.id) ? 1 : 2) * 10 + sc : sc > 0 && !used.has(c.id) ? sc : -1; };
      const ranked = [...pool.values()]
        .map((c, i) => ({ c, i, s: tier(c) }))
        .filter((x) => x.s >= 0)
        .sort((a, b) => b.s - a.s || a.i - b.i);
      const picks = ranked.slice(0, PER_PRODUCT).map((x) => x.c);
      if (!picks.length) {
        console.warn(`  ${p.sku}: no results for "${query}"`);
        continue;
      }
      const dir = path.join(OUT, p.sku);
      mkdirSync(dir, { recursive: true });
      for (const [i, photo] of picks.entries()) {
        const file = `${p.sku}/${i + 1}.webp`;
        await saveWebp(photo, path.join(OUT, file));
        used.add(photo.id);
        const idx = credits.findIndex((c) => c.file === file);
        const { tags: _tags, ...rest } = photo; // tags are only for ranking
        const credit: Credit = { ...rest, sku: p.sku, file, query, licence: LICENCE[photo.source] };
        if (idx >= 0) credits[idx] = credit;
        else credits.push(credit);
      }
      done++;
      console.log(`  ${p.sku} ✓ "${query}"`);
      writeCredits(credits);
    } catch (err) {
      console.error(`  ${p.sku} ✗ ${err instanceof Error ? err.message : err}`);
      if (String(err).includes(" 429")) {
        console.error("Rate limited. Wait an hour and run again; finished products are skipped.");
        break;
      }
    }
  }
  console.log(`\n${done}/${products.length} products updated. Credits: notes/image-credits.md. Run "npm run seed" to attach them.`);
}

main();
