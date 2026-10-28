// Plain, serialisable shapes passed from server to UI (no Mongoose documents or ObjectIds).

export type ImageDTO = { url: string; alt: string };

export type ProductCardDTO = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  salePrice: number | null;
  image: ImageDTO | null;
  hoverImage: ImageDTO | null;
  inStock: boolean;
  colours: string[];
  tags: string[];
};

export type VariantDTO = { id: string; sku: string; size: string; colour: string; colourHex: string | null; stock: number; price: number };

export type ProductDetailDTO = ProductCardDTO & {
  skuBase: string;
  description: string;
  fabric: string;
  careNotes: string;
  images: ImageDTO[];
  sizeType: string;
  categorySlug: string;
  categoryId: string;
  collections: { name: string; slug: string }[];
  variants: VariantDTO[];
  seoTitle: string;
  seoDescription: string;
};

export type CategoryDTO = { id: string; name: string; slug: string; description: string; image: string; showInNav: boolean; seoTitle: string; seoDescription: string };
export type CollectionDTO = { id: string; name: string; slug: string; description: string; image: string };

export type Cta = { label: string; href: string };

export type StoreSettings = {
  storeName: string;
  tagline: string;
  legal: { name: string; tradeLicence: string; tin: string; bin: string };
  contact: { phone: string; whatsapp: string; email: string; supportEmail: string; ordersEmail: string };
  address: { line: string; area: string; city: string; postalCode: string; country: string };
  hours: { label: string; value: string }[];
  socials: { facebook: string; instagram: string; youtube: string; tiktok: string };
  announcementBar: { text: string; link: string; active: boolean };
  hero: { eyebrow: string; title: string; subtitle: string; image: string; note: string; ctas: Cta[] };
  newSeasonBanner: { eyebrow: string; title: string; text: string; image: string; cta: Cta };
  freeDeliveryThreshold: number;
  abandonedAfterMinutes: number;
  lowStockThreshold: number;
  payments: { cod: boolean; sslcommerz: boolean; bkash: { enabled: boolean; number: string }; nagad: { enabled: boolean; number: string } };
  bank: { accountName: string; accountNo: string; bankBranch: string };
  invoiceFooter: string;
};

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name";
export const SORT_KEYS: SortKey[] = ["featured", "newest", "price-asc", "price-desc", "name"];

export type ProductQuery = {
  category?: string; // category id
  collection?: string; // collection id
  q?: string;
  sizes?: string[];
  colours?: string[];
  min?: number;
  max?: number;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};

export type ProductListResult = {
  items: ProductCardDTO[];
  total: number;
  page: number;
  pages: number;
  facets: { sizes: string[]; colours: { name: string; hex: string }[]; minPrice: number; maxPrice: number };
};

export type CartLineDTO = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  size: string;
  colour: string;
  sku: string;
  qty: number;
  unitPrice: number;
  regularPrice: number;
  lineTotal: number;
  /** Units available right now; qty is already clamped to this. */
  stock: number;
  maxQty: number;
};

export type CartView = {
  lines: CartLineDTO[];
  count: number;
  subtotal: number;
  freeDeliveryThreshold: number;
  freeDeliveryGap: number;
  /** True when the shopper should be asked for name/phone/email (no lead yet and not skipped). */
  needsLead: boolean;
  lead: { name: string; phone: string; email: string } | null;
  /** Messages about lines that changed since last visit (sold out, reduced qty, removed). */
  notices: string[];
};
