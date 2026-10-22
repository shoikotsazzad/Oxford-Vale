// Business details used across the whole site (navbar, footer, contact, SEO, JSON-LD).
// Replace every [PLACEHOLDER] with real client info. Never invent numbers or addresses.

export const site = {
  name: "[PLACEHOLDER: Business Name]",
  tagline: "[PLACEHOLDER: One-line tagline]",
  description: "[PLACEHOLDER: 1–2 sentence description of the business and area served]",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  lang: "en", // "en" | "bn"
  locale: "en_US", // "en_US" | "bn_BD"
  logo: "/images/logo.svg",
  ogImage: "/images/og.svg", // replace with a 1200x630 JPG for production

  // Phone in international format. WhatsApp: digits only, with country code.
  phone: "+8801XXXXXXXXX",
  phoneDisplay: "01X-XXXX-XXXX",
  whatsapp: "8801XXXXXXXXX",
  whatsappGreeting: "Hello, I found you on your website and would like to know more.",
  email: "[PLACEHOLDER: email]",

  address: {
    street: "[PLACEHOLDER: House/Road]",
    area: "[PLACEHOLDER: Area]",
    city: "[PLACEHOLDER: City]",
    postalCode: "",
    country: "BD",
  },
  geo: null as { lat: number; lng: number } | null,
  mapUrl: "", // Google Maps place link
  mapEmbedUrl: "", // Google Maps embed src (Share → Embed a map)

  // Days: Mo Tu We Th Fr Sa Su. Times in 24h.
  hours: [
    { days: ["Sa", "Su", "Mo", "Tu", "We", "Th"], opens: "10:00", closes: "20:00" },
  ],
  hoursText: "[PLACEHOLDER: e.g. Sat–Thu, 10am–8pm · Friday closed]",

  socials: {
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  },

  schemaType: "LocalBusiness", // industry skill names the exact type
  priceRange: "৳৳",

  nav: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
  ],
  cta: { label: "WhatsApp Us", href: "whatsapp" }, // "whatsapp" | "call" | a route
};

export type Site = typeof site;
