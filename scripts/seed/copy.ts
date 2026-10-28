// Generated product copy: a short description and care notes from name + fabric + tag.
// One fixed template per fabric family, so the text is consistent and never makes claims we can't back.
import type { CsvProduct } from "./csv";

type Family = "wool" | "tweed" | "cotton" | "linen" | "leather" | "suede" | "silk" | "knit" | "synthetic" | "metal" | "straw" | "felt";

export function fabricFamily(fabric: string): Family {
  const f = fabric.toLowerCase();
  if (/tweed|herringbone/.test(f)) return "tweed";
  if (/merino|cashmere|lambswool|acrylic|knit/.test(f)) return "knit";
  if (/suede/.test(f)) return "suede";
  if (/leather|lambskin/.test(f)) return "leather";
  if (/silk|satin|velvet|viscose/.test(f)) return "silk";
  if (/linen/.test(f)) return "linen";
  if (/wool|flannel|shearling/.test(f)) return "wool";
  if (/cotton|chambray|denim|corduroy|canvas|pique/.test(f)) return "cotton";
  if (/brass|silver|metal|fibreglass/.test(f)) return "metal";
  if (/straw/.test(f)) return "straw";
  if (/felt/.test(f)) return "felt";
  return "synthetic"; // polyester, nylon blends
}

const FABRIC_LINE: Record<Family, string> = {
  wool: "Wool gives it a soft drape, natural warmth and a shape that holds through a long day.",
  tweed: "The tweed has a dense, textured weave that is warm, hard-wearing and rich in character.",
  cotton: "The cotton is breathable and comfortable, a dependable choice for Dhaka's warmer months.",
  linen: "Linen keeps it light and cool, with the relaxed texture that softens with every wear.",
  leather: "Cut from leather that is supple from the first wear and develops a richer patina with age.",
  suede: "Soft suede adds a warm, matte texture that pairs easily with tailoring or denim.",
  silk: "A smooth, lustrous finish that catches the light and gives a formal outfit its finishing touch.",
  knit: "A fine, soft knit that layers neatly under a jacket or coat without adding bulk.",
  synthetic: "A practical, easy-care fabric that resists creasing and stands up to daily use.",
  metal: "Finished by hand, with a weight and shine that feel considered rather than flashy.",
  straw: "Woven straw keeps it light and breathable for sunny days.",
  felt: "Structured felt holds a clean shape and adds a classic note to winter outfits.",
};

const CARE: Record<Family, string> = {
  wool: "Dry clean only. Hang on a shaped hanger and brush after wear. Steam rather than iron.",
  tweed: "Dry clean only. Air between wears and brush gently with a clothes brush. Store on a wide hanger.",
  cotton: "Machine wash cold with similar colours. Do not bleach. Warm iron, inside out for dark colours.",
  linen: "Hand wash or gentle machine wash cold. Line dry in shade. Iron while slightly damp.",
  leather: "Wipe with a soft dry cloth. Condition every few months. Keep away from direct heat and store with shoe trees or stuffing.",
  suede: "Brush with a suede brush to lift the nap. Protect with a suede spray. Do not wash.",
  silk: "Dry clean only. Roll or hang to store, and keep away from perfume and direct sunlight.",
  knit: "Hand wash cold or dry clean. Dry flat in shape. Fold, do not hang.",
  synthetic: "Machine wash cold on a gentle cycle. Do not tumble dry. Cool iron if needed.",
  metal: "Wipe with a soft dry cloth. Store in the box or pouch provided, away from moisture.",
  straw: "Spot clean only. Keep dry and store crown-down or on a hat stand to keep the shape.",
  felt: "Brush in an anticlockwise direction to remove dust. Spot clean only. Keep dry.",
};

const CATEGORY_LINE: Record<string, string> = {
  Suits: "A tailored suit with clean lines, built for the office, weddings and every formal occasion in between.",
  Blazers: "A versatile blazer that sharpens chinos, denim or tailored trousers.",
  Outerwear: "Outerwear designed for layering over tailoring and knitwear when the weather turns.",
  Waistcoats: "A tailored waistcoat to wear with a suit or on its own over a crisp shirt.",
  Shirts: "A shirt with a neat collar and comfortable fit, easy to dress up or down.",
  Trousers: "Trousers with a clean leg and comfortable rise, made to pair with jackets and knitwear alike.",
  Knitwear: "Knitwear for cooler evenings, smart enough for the office and relaxed enough for the weekend.",
  Ties: "A finishing piece for formal shirts and tailoring.",
  Accessories: "A considered accessory that completes a heritage look.",
  Caps: "A classic cap in the English country tradition.",
  Shoes: "Made on a classic last, with a profile that suits both tailoring and smart-casual outfits.",
};

const TAG_LINE: Record<string, string> = {
  "Best Seller": "One of our most-loved pieces.",
  "New Season": "New this season.",
  Heritage: "Part of our Heritage line, inspired by traditional English dress.",
  Winter: "A cold-weather favourite for the winter months.",
  Summer: "Light enough for the Bangladeshi summer.",
  Limited: "Made in a limited run.",
};

export function describe(p: CsvProduct) {
  const fam = fabricFamily(p.fabric);
  const parts = [
    `The ${p.name} in ${p.fabric.toLowerCase()}.`,
    CATEGORY_LINE[p.category] ?? "",
    FABRIC_LINE[fam],
    TAG_LINE[p.tag] ?? "",
  ].filter(Boolean);
  return { description: parts.join(" "), careNotes: CARE[fam] };
}
