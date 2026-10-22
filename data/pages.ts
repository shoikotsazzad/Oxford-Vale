// Per-page SEO and short page copy. Keys match routes in lib/seo.ts.

export const pages = {
  home: {
    path: "/",
    title: "[PLACEHOLDER: Business] — [Main service] in [City]",
    description: "[PLACEHOLDER: 140–160 chars: what you offer, where, and a call to action]",
    hero: {
      eyebrow: "[PLACEHOLDER: Area, City]",
      heading: "[PLACEHOLDER: Clear headline — what you do and where]",
      text: "[PLACEHOLDER: One supporting sentence]",
      image: "/images/placeholder.svg",
      primaryCta: { label: "WhatsApp Us", href: "whatsapp" },
      secondaryCta: { label: "Our Services", href: "/services" },
    },
  },
  about: {
    path: "/about",
    title: "About Us",
    description: "[PLACEHOLDER: About page meta description]",
    heading: "About [PLACEHOLDER: Business]",
    paragraphs: ["[PLACEHOLDER: Story — when started, who runs it, what makes it different]"],
    image: "/images/placeholder.svg",
  },
  services: {
    path: "/services",
    title: "Services",
    description: "[PLACEHOLDER: Services page meta description]",
    heading: "Our Services",
    intro: "[PLACEHOLDER: Short intro]",
  },
  gallery: {
    path: "/gallery",
    title: "Gallery",
    description: "[PLACEHOLDER: Gallery page meta description]",
    heading: "Gallery",
  },
  contact: {
    path: "/contact",
    title: "Contact",
    description: "[PLACEHOLDER: Contact page meta description with area]",
    heading: "Contact Us",
    intro: "Call, WhatsApp or send us a message.",
  },
  privacy: {
    path: "/privacy",
    title: "Privacy Policy",
    description: "How we handle information you share through this website.",
  },
  terms: {
    path: "/terms",
    title: "Terms & Conditions",
    description: "Terms for using this website and our services.",
  },
} as const;

export type PageKey = keyof typeof pages;
