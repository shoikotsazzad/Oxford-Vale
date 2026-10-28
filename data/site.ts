// Business details. The seed copies these into the Setting document, which the admin can then edit.
// The storefront reads the Setting document; these values are the fallback when the database is empty.
// Source: notes/client.md. Items marked "placeholder" there are not real.

export const site = {
  name: "Oxford Vale",
  tagline: "English heritage for a modern generation",
  description:
    "Oxford Vale is an English heritage menswear brand in Dhaka: tailored suits, outerwear, waistcoats, shirts, caps and shoes, delivered across Bangladesh with cash on delivery.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? "http://localhost:3000",
  lang: "en", // default UI language; Bangla is a toggle
  locale: "en_US",
  ogImage: "/brand/og-image.jpg",

  // Phone in international format. WhatsApp: digits only, with country code.
  phone: "+8801700000001",
  phoneDisplay: "01700-000001",
  whatsapp: "8801700000002",
  whatsappDisplay: "01700-000002",
  whatsappGreeting: "Hello Oxford Vale, I have a question about a product.",
  email: "hello@oxfordvale.example",
  supportEmail: "support@oxfordvale.example",
  ordersEmail: "orders@oxfordvale.example",

  legal: {
    name: "Oxford Vale Menswear Ltd.", // placeholder
    tradeLicence: "TRAD/DNCC/000000/2026", // placeholder
    tin: "000000000000", // placeholder
    bin: "000000000-0000", // placeholder
  },

  address: {
    line: "House 12, Road 27, Block A",
    area: "Gulshan 1",
    city: "Dhaka",
    postalCode: "1212",
    country: "Bangladesh",
  },
  geo: null as { lat: number; lng: number } | null,
  mapUrl: "",
  mapEmbedUrl: "",

  // Days: Mo Tu We Th Fr Sa Su. Times in 24h (for JSON-LD).
  hours: [
    { days: ["Sa", "Su", "Mo", "Tu", "We", "Th"], opens: "10:00", closes: "21:00" },
    { days: ["Fr"], opens: "14:00", closes: "21:00" },
  ],
  hoursText: [
    { label: "Saturday – Thursday", value: "10:00 AM – 9:00 PM" },
    { label: "Friday", value: "2:00 PM – 9:00 PM" },
  ],

  socials: {
    facebook: "https://facebook.com/oxfordvale",
    instagram: "https://instagram.com/oxfordvale",
    youtube: "https://youtube.com/@oxfordvale",
    tiktok: "",
  },

  payments: {
    bkashNumber: "01700-000003",
    nagadNumber: "01700-000004",
  },
  bank: {
    accountName: "Oxford Vale Menswear Ltd.",
    accountNo: "0000000000000", // placeholder
    bankBranch: "Sample Bank, Gulshan 2 Branch", // placeholder
  },

  schemaType: "ClothingStore",
  priceRange: "৳৳৳",

  // Delivery defaults (approved in notes/plan.md §9). Editable in admin.
  freeDeliveryThreshold: 10000,
  abandonedAfterMinutes: 60,
  lowStockThreshold: 5,

  announcement: { text: "Free delivery across Bangladesh on orders over ৳10,000", link: "/shipping-policy" },
  hero: {
    eyebrow: "New collection",
    title: "OXFORD VALE",
    subtitle: "English heritage for a modern generation",
    image: "/brand/hero-model.png",
    note: "Tailoring, tweed and outerwear for the season ahead.",
    ctas: [
      { label: "Shop Now", href: "/shop" },
      { label: "Explore Collection", href: "/collections/new-season" },
    ],
  },
  newSeasonBanner: {
    eyebrow: "New Season",
    title: "Tailored for the colder months",
    text: "Herringbone, tweed and heavyweight wool, cut for a sharper silhouette.",
    image: "/brand/new-season.jpg",
    cta: { label: "Shop New Season", href: "/collections/new-season" },
  },
  invoiceFooter: "Thank you for shopping with Oxford Vale. Exchanges and returns within 14 days of delivery.",
};

export type Site = typeof site;
