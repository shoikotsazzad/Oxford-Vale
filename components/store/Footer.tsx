import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { CategoryDTO, StoreSettings } from "@/lib/types";
import { mailtoLink, telLink } from "@/lib/contact";
import { site } from "@/data/site";
import { MailIcon, PhoneIcon, PinIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";
import { Year } from "./Year";

export function Footer({ settings, categories, t }: { settings: StoreSettings; categories: CategoryDTO[]; t: Dict }) {
  const { contact, address, socials, hours, legal } = settings;
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
    { label: "X", href: socials.x },
    { label: "YouTube", href: socials.youtube },
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

  // Phones and tablets: the essentials, centred. The full columns are for desktop.
  const quick = [help[0], help[2], help[3], company[1], company[2], company[3]];
  const legalLine = legal.companyNo && (
    <>{legal.name} is registered in England and Wales (company no. {legal.companyNo}). Registered office: {legal.registeredOffice}. VAT no. {legal.vatNo}.</>
  );

  return (
    <footer className="mt-auto bg-charcoal text-white">
      <Container className="py-10 text-center lg:hidden">
        <Link href="/" className="font-serif text-2xl tracking-[0.12em]">{settings.storeName.toUpperCase()}</Link>
        <p className="mt-1.5 text-sm text-white/60">{settings.tagline}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          <a href={telLink(contact.phone)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-white/85 hover:border-white/40">
            <PhoneIcon size={16} className="text-white/60" />{contact.phone}
          </a>
          <a href={mailtoLink(contact.email)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-white/85 hover:border-white/40">
            <MailIcon size={16} className="text-white/60" />{t.footer.emailUs}
          </a>
        </div>
        <ul className="mx-auto mt-7 flex max-w-md flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
          {quick.map((l) => (
            <li key={l.href}><Link href={l.href} className="inline-flex min-h-9 items-center text-white/75 hover:text-white">{l.label}</Link></li>
          ))}
        </ul>
        <ul className="mt-7 flex flex-wrap justify-center gap-1.5 text-[11px]">
          {site.paymentBrands.map((m) => (
            <li key={m} className="rounded border border-white/15 px-2 py-0.5 text-white/60">{m}</li>
          ))}
        </ul>
        {social.length > 0 && (
          <ul className="mt-6 flex justify-center gap-5 text-sm">
            {social.map((s) => (
              <li key={s.label}><a href={s.href} target="_blank" rel="noopener" className="text-white/70 hover:text-white">{s.label}</a></li>
            ))}
          </ul>
        )}
        <div className="mx-auto mt-7 max-w-md border-t border-white/10 pt-6 text-[11px] leading-relaxed text-white/50">
          <p>© <Year /> {(legal.name || settings.storeName).replace(/\.$/, "")}. {t.footer.rights}</p>
          {legalLine && <p className="mt-1.5">{legalLine}</p>}
        </div>
      </Container>

      <Container className="hidden py-14 md:py-20 lg:block">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="font-serif text-3xl tracking-[0.12em]">{settings.storeName.toUpperCase()}</Link>
            <p className="mt-2 text-sm text-white/60">{settings.tagline}</p>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              <li className="flex gap-3"><PinIcon size={18} className="mt-0.5 shrink-0 text-white/50" /><span>{[address.line, address.area, `${address.city} ${address.postalCode}`.trim(), address.country].filter(Boolean).join(", ")}</span></li>
              <li className="flex gap-3"><PhoneIcon size={18} className="mt-0.5 shrink-0 text-white/50" /><a href={telLink(contact.phone)} className="hover:text-white">{contact.phone}</a></li>
              {contact.freephone && <li className="flex gap-3"><PhoneIcon size={18} className="mt-0.5 shrink-0 text-white/50" /><span>{t.footer.freephone} <a href={telLink(contact.freephone)} className="hover:text-white">{contact.freephone}</a></span></li>}
              <li className="flex gap-3"><MailIcon size={18} className="mt-0.5 shrink-0 text-white/50" /><a href={mailtoLink(contact.email)} className="hover:text-white">{contact.email}</a></li>
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
              {site.paymentBrands.map((m) => (
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
          © <Year /> {(legal.name || settings.storeName).replace(/\.$/, "")}. {t.footer.rights}
        </p>
        {legal.companyNo && (
          <p className="mt-2 max-w-3xl text-xs text-white/60">{legalLine}</p>
        )}
      </Container>
    </footer>
  );
}
