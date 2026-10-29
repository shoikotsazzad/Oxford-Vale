// Store prices in US dollars (cents). The product sheet (notes/assets/products.csv) has the original taka prices;
// each category is mapped onto a UK-realistic dollar range, keeping every product's relative position in it,
// then rounded to $5. Sale prices keep their original discount ratio. Pure: used by the seed, migration and tests.

/** Dollar range per category (approved 2026-10-28). */
export const USD_RANGES: Record<string, [number, number]> = {
  Suits: [230, 320],
  Outerwear: [190, 330],
  Blazers: [150, 240],
  Waistcoats: [90, 150],
  Shirts: [55, 95],
  Knitwear: [75, 140],
  Trousers: [70, 120],
  Ties: [30, 50],
  Shoes: [150, 250],
  Caps: [45, 75],
  Accessories: [25, 150],
};

type Row = { sku: string; category: string; price: number; salePrice?: number };
const to5 = (dollars: number) => Math.max(5, Math.round(dollars / 5) * 5);

/** SKU → { price, salePrice } in cents. */
export function usdPrices(rows: Row[]) {
  const bounds = new Map<string, [number, number]>();
  for (const r of rows) {
    const [lo, hi] = bounds.get(r.category) ?? [Infinity, -Infinity];
    bounds.set(r.category, [Math.min(lo, r.price), Math.max(hi, r.price)]);
  }
  const out = new Map<string, { price: number; salePrice?: number }>();
  for (const r of rows) {
    const range = USD_RANGES[r.category];
    if (!range) throw new Error(`No dollar range for category "${r.category}" (scripts/seed/usd.ts)`);
    const [lo, hi] = bounds.get(r.category)!;
    const pos = hi > lo ? (r.price - lo) / (hi - lo) : 0.5;
    const price = to5(range[0] + pos * (range[1] - range[0]));
    let sale = r.salePrice ? to5(price * (r.salePrice / r.price)) : undefined;
    if (sale !== undefined && sale >= price) sale = price - 5;
    out.set(r.sku, { price: price * 100, ...(sale !== undefined && { salePrice: sale * 100 }) });
  }
  return out;
}
