import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { CategoryDTO, StoreSettings } from "@/lib/types";
import { telLink, whatsappLink } from "@/lib/contact";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";
import { Year } from "./Year";

export function Footer({ settings, categories, t }: { settings: StoreSettings; categories: CategoryDTO[]; t: Dict }) {
  const { contact, address, socials, hours } = settings;
  const help = [
    { label: t.footer.track, href: "/track-order" },
    { label: t.footer.sizeGuide, href: "/size-guide" },
    { label: t.footer.shipping, href: "/shipping-policy" },
    { label: t.footer.returns, href: "/returns-policy" },
  ];
  const company = [
    { label: t.footer.about, href: "/about" },
    { label: t.footer.contactUs, href: "/contact" },
    { label: t.footer.privacy, href: "/privacy" },
    { label: t.footer.terms, href: "/terms" },
  ];
  const social = [
    { label: "Facebook", href: socials.facebook },
    { label: "Instagram", href: socials.instagram },
    { label: "YouTube", href: socials.youtube },
    { label: "TikTok", href: socials.tiktok },
  ].filter((s) => s.href);

  const col = (title: string, links: { label: string; href: string }[]) => (
    <div>
      <p className="label text-white/50">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}><Link href={l.href} className="text-white/80 hover:text-white">{l.label}</Link></li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="mt-auto bg-charcoal text-white">
      <Container className="py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="font-serif text-3xl tracking-[0.12em]">{settings.storeName.toUpperCase()}</Link>
            <p className="mt-2 text-sm text-white/60">{settings.tagline}</p>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              <li className="flex gap-3"><PinIcon size={18} className="mt-0.5 shrink-0 text-white/50" /><span>{[address.line, address.area, `${address.city} ${address.postalCode}`.trim(), address.country].filter(Boolean).join(", ")}</span></li>
              <li className="flex gap-3"><PhoneIcon size={18} className="mt-0.5 shrink-0 text-white/50" /><a href={telLink(contact.phone)} className="hover:text-white">{contact.phone}</a></li>
              <li className="flex gap-3"><WhatsAppIcon size={18} className="mt-0.5 shrink-0 text-white/50" /><a href={whatsappLink(contact.whatsapp)} target="_blank" rel="noopener" className="hover:text-white">{contact.whatsapp}</a></li>
              <li className="flex gap-3"><MailIcon size={18} className="mt-0.5 shrink-0 text-white/50" /><a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a></li>
            </ul>
            <ul className="mt-4 space-y-1 text-xs text-white/50">
              {hours.map((h) => <li key={h.label}>{h.label}: {h.value}</li>)}
            </ul>
          </div>
          {col(t.footer.shop, categories.map((c) => ({ label: c.name, href: `/shop/${c.slug}` })).slice(0, 8))}
          {col(t.footer.help, help)}
          {col(t.footer.company, company)}
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="label text-white/50">{t.footer.payWith}</p>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs">
              {["Cash on Delivery", "bKash", "Nagad", "Visa", "Mastercard", "SSLCommerz"].map((m) => (
                <li key={m} className="rounded border border-white/15 px-2.5 py-1 text-white/70">{m}</li>
              ))}
            </ul>
          </div>
          {social.length > 0 && (
            <ul className="flex gap-5 text-sm">
              {social.map((s) => (
                <li key={s.label}><a href={s.href} target="_blank" rel="noopener" className="text-white/70 hover:text-white">{s.label}</a></li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-8 text-xs text-white/60">
          © <Year /> {(settings.legal.name || settings.storeName).replace(/\.$/, "")}. {t.footer.rights}
        </p>
      </Container>
    </footer>
  );
}
