import { site } from "@/data/site";

export const telLink = () => `tel:${site.phone}`;

export const whatsappLink = (text: string = site.whatsappGreeting) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

/** Resolve a CTA href: "whatsapp", "call", or a normal route/URL. */
export const ctaHref = (href: string) =>
  href === "whatsapp" ? whatsappLink() : href === "call" ? telLink() : href;

export const isExternal = (href: string) => /^(https?:|tel:|mailto:)/.test(href);
