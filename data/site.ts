// Business details (fictional UK brand for a portfolio; registration numbers and bank details are placeholders).
// The seed copies these into the Setting document, which the admin can then edit.
// The storefront reads the Setting document; these values are the fallback when the database is empty.
// Source: notes/client.md. Items marked "placeholder" there are not real.

export const site = {
  name: "Oxford Vale",
  tagline: "English heritage for a modern generation",
  description:
    "Oxford Vale is an English heritage menswear brand from Savile Row, London: tailored suits, overcoats, waistcoats, shirts, flat caps and shoes, delivered across the UK and worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? "http://localhost:3000",
  domain: "www.oxfordvale.example", // placeholder
  lang: "en-GB",
  locale: "en_GB",
  ogImage: "/brand/og-image.jpg",

  // Fictional numbers: 020 7946 xxxx is reserved by Ofcom for drama, so it can never reach a real person.
  phone: "02079460001",
  phoneDisplay: "020 7946 0001",
  freephone: "08000000001",
  freephoneDisplay: "0800 000 0001",
  email: "hello@oxfordvale.example",
  supportEmail: "support@oxfordvale.example",
  ordersEmail: "orders@oxfordvale.example",

  legal: {
    name: "Oxford Vale Menswear Ltd.", // placeholder
    companyNo: "00000000", // placeholder (Companies House, 8 digits)
    vatNo: "GB 000 0000 00", // placeholder
    registeredOffice: "14 Savile Row, London W1S 3PR", // placeholder number on a real street
  },

  // Showroom, head office and dispatch.
  address: {
    line: "14 Savile Row",
    area: "Mayfair",
    city: "London",
    postalCode: "W1S 3PR",
    country: "United Kingdom",
  },
  geo: null as { lat: number; lng: number } | null,
  mapUrl: "",
  mapEmbedUrl: "",

  // Days: Mo Tu We Th Fr Sa Su. Times in 24h, UK time (for JSON-LD).
  hours: [
    { days: ["Mo", "Tu", "We", "Th", "Fr"], opens: "09:00", closes: "18:00" },
    { days: ["Sa"], opens: "10:00", closes: "17:00" },
  ],
  hoursText: [
    { label: "Monday – Friday", value: "9:00 AM – 6:00 PM" },
    { label: "Saturday", value: "10:00 AM – 5:00 PM" },
    { label: "Sunday & bank holidays", value: "Closed" },
  ],

  socials: {
    facebook: "https://facebook.com/oxfordvale",
    instagram: "https://instagram.com/oxfordvale",
    x: "https://x.com/oxfordvale",
    youtube: "https://youtube.com/@oxfordvale",
  },

  paymentBrands: ["Visa", "Mastercard", "American Express", "PayPal", "Apple Pay", "Google Pay", "Klarna"],
  bank: {
    accountName: "Oxford Vale Menswear Ltd.",
    sortCode: "00-00-00", // placeholder
    accountNo: "00000000", // placeholder
    bank: "Sample Bank, Mayfair branch", // placeholder
  },

  schemaType: "ClothingStore",
  priceRange: "$$$",
  currency: "USD",

  // Delivery: amounts in cents. Free UK standard delivery over $125. Editable in admin.
  freeDeliveryThreshold: 12500,
  abandonedAfterMinutes: 60,
  lowStockThreshold: 5,

  announcement: { text: "Free UK delivery on orders over $125 · Free 30-day UK returns", link: "/shipping-policy" },
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
  invoiceFooter: "Thank you for shopping with Oxford Vale. For returns within 30 days, keep this invoice and contact support@oxfordvale.example.",
};

export type Site = typeof site;
