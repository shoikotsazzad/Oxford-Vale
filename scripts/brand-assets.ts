// npm run brand-assets — generates the favicon set and the default social share image from the wordmark.
// Replace public/brand/og-image.jpg with a real photo-based image when brand photography is ready.
// Also fills missing home-page photos (category tiles, collections, banners) with stand-ins cut from product photos.
// Existing files are never overwritten, so real brand photography dropped into public/brand/ stays.
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const INK = "#111111", PAPER = "#F7F5F0", MUTED = "#B9B2A6";
const serif = "'Playfair Display', Georgia, 'Times New Roman', serif";

/** public/brand/<file> ← public/products/<SKU>/<n>.webp, resized to width × height (credits: notes/image-credits.md). */
const STAND_INS: { file: string; from: string; width: number; height: number; position?: string }[] = [
  { file: "cat-suits.jpg", from: "OV-SUT-004/2", width: 400, height: 500 },
  { file: "cat-outerwear.jpg", from: "OV-OUT-001/1", width: 400, height: 500 },
  { file: "cat-accessories.jpg", from: "OV-ACC-005/1", width: 400, height: 500 },
  { file: "cat-caps.jpg", from: "OV-CAP-006/2", width: 400, height: 500 },
  { file: "cat-shoes.jpg", from: "OV-SHO-001/2", width: 400, height: 500 },
  { file: "new-season.jpg", from: "OV-SUT-009/2", width: 1000, height: 900, position: "top" },
  { file: "col-heritage.jpg", from: "OV-CAP-008/1", width: 900, height: 1125 },
  { file: "col-winter-edit.jpg", from: "OV-OUT-017/1", width: 900, height: 1125 },
  { file: "col-limited-edition.jpg", from: "OV-SUT-004/1", width: 900, height: 1125 },
  { file: "shop-the-look.jpg", from: "OV-SUT-014/2", width: 1000, height: 1250 },
];

const monogram = (size: number, radius: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
<rect width="64" height="64" rx="${radius}" fill="${INK}"/>
<text x="32" y="43" text-anchor="middle" font-family="${serif}" font-size="30" letter-spacing="1" fill="${PAPER}">OV</text></svg>`;

/** ICO container holding PNG images (supported by every current browser). */
function ico(pngs: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

(async () => {
  writeFileSync(path.join(ROOT, "app/icon.svg"), monogram(64, 12));
  const png = (size: number, radius = 12) => sharp(Buffer.from(monogram(size, radius))).resize(size, size).png().toBuffer();
  writeFileSync(path.join(ROOT, "app/apple-icon.png"), await png(180, 0)); // iOS rounds the corners itself
  writeFileSync(path.join(ROOT, "app/favicon.ico"), ico([{ size: 32, data: await png(32) }, { size: 48, data: await png(48) }]));

  const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="${INK}"/>
<rect x="40" y="40" width="1120" height="550" fill="none" stroke="#3A3631" stroke-width="2"/>
<text x="600" y="300" text-anchor="middle" font-family="${serif}" font-size="120" letter-spacing="14" fill="${PAPER}">OXFORD VALE</text>
<text x="600" y="370" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="6" fill="${MUTED}">ENGLISH HERITAGE FOR A MODERN GENERATION</text>
<text x="600" y="520" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="4" fill="${MUTED}">MENSWEAR · DHAKA · CASH ON DELIVERY ACROSS BANGLADESH</text></svg>`;
  await sharp(Buffer.from(og)).jpeg({ quality: 88 }).toFile(path.join(ROOT, "public/brand/og-image.jpg"));
  console.log("app/icon.svg, app/apple-icon.png, app/favicon.ico, public/brand/og-image.jpg");

  for (const s of STAND_INS) {
    const out = path.join(ROOT, "public/brand", s.file);
    if (existsSync(out)) continue;
    await sharp(path.join(ROOT, "public/products", `${s.from}.webp`)).resize(s.width, s.height, { fit: "cover", position: s.position ?? "centre" }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
    console.log(`public/brand/${s.file} (stand-in from ${s.from})`);
  }
})();
