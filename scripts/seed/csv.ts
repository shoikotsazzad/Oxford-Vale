import { readFileSync } from "node:fs";

export type CsvProduct = {
  sku: string;
  name: string;
  category: string;
  price: number;
  salePrice?: number;
  colour: string;
  sizes: string;
  tag: string;
  fabric: string;
  stockPerSize: number;
};

/** Minimal CSV reader with quoted-field support (the product sheet has no embedded newlines). */
function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function readProductsCsv(path: string): CsvProduct[] {
  const [header, ...rows] = readFileSync(path, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  const cols = parseLine(header);
  const idx = (name: string) => {
    const i = cols.indexOf(name);
    if (i < 0) throw new Error(`products.csv is missing the "${name}" column`);
    return i;
  };
  const c = {
    sku: idx("SKU"), name: idx("Name"), category: idx("Category"), price: idx("Price_BDT"), sale: idx("Sale_BDT"),
    colours: idx("Colours"), sizes: idx("Sizes"), tag: idx("Tag"), fabric: idx("Fabric"), stock: idx("Stock_per_size"),
  };
  return rows.map((line, n) => {
    const f = parseLine(line);
    const price = Number(f[c.price]);
    const sale = f[c.sale] ? Number(f[c.sale]) : undefined;
    const stock = Number(f[c.stock]);
    if (!f[c.sku] || !Number.isInteger(price) || !Number.isInteger(stock) || (sale !== undefined && !Number.isInteger(sale))) {
      throw new Error(`products.csv row ${n + 2} is invalid: ${line}`);
    }
    return {
      sku: f[c.sku], name: f[c.name], category: f[c.category], price, salePrice: sale && sale < price ? sale : undefined,
      colour: f[c.colours], sizes: f[c.sizes], tag: f[c.tag], fabric: f[c.fabric], stockPerSize: stock,
    };
  });
}
