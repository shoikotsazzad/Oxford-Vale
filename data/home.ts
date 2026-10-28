// Home page copy that isn't admin-editable. Hero and new-season banner text live in admin → Settings.

/** Category band: which categories to feature (by slug), with a short line each. Image: public/brand/cat-<slug>.jpg */
export const categoryBand = [
  { slug: "suits", line: "Timeless tailoring with character." },
  { slug: "outerwear", line: "Classic coats for every season." },
  { slug: "accessories", line: "The details make the difference." },
  { slug: "caps", line: "An iconic look for modern times." },
  { slug: "shoes", line: "Built on classic lasts, made to last." },
];

/** "Best of" row on the home page: a collection slug. */
export const bestOfCollection = "best-sellers";

/** "New arrivals" carousel: a collection slug. */
export const newArrivalsCollection = "new-season";

/** Collections mosaic: which collections to feature, with a short line each. Image: the collection's image (admin), else public/brand/col-<slug>.jpg */
export const collectionTiles = [
  { slug: "heritage", line: "Tweed, flannel and the flat cap: dress codes that never date." },
  { slug: "winter-edit", line: "Overcoats and knitwear for Dhaka's cooler months." },
  { slug: "limited-edition", line: "Small runs of our finest cloth." },
];

/** "Shop the look": one outfit photo and the products in it (by slug, in display order). */
export const shopTheLook = {
  title: "The waistcoat edit",
  text: "A suede waistcoat over a crisp poplin shirt, finished with a slim grey tie and polished brogues.",
  image: "/brand/shop-the-look.jpg",
  products: ["tan-suede-waistcoat", "white-poplin-dress-shirt", "silver-grey-skinny-tie", "brown-oxford-brogues"],
};
