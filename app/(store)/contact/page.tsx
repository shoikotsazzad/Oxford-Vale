import { getT } from "@/server/i18n";
import { getSettings } from "@/server/services/settings";
import { buildMetadata } from "@/lib/seo";
import { telLink, whatsappLink } from "@/lib/contact";
import { contact } from "@/data/pages";
import { PageShell } from "@/components/store/PageShell";
import { ContactForm } from "@/components/store/ContactForm";
import { MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";

export const metadata = buildMetadata({ title: contact.title, description: contact.description, path: "/contact" });

export default async function ContactPage() {
  const [t, s] = await Promise.all([getT(), getSettings()]);
  const rows = [
    { icon: PhoneIcon, label: s.contact.phone, href: telLink(s.contact.phone) },
    { icon: WhatsAppIcon, label: `WhatsApp ${s.contact.whatsapp}`, href: whatsappLink(s.contact.whatsapp), external: true },
    { icon: MailIcon, label: s.contact.email, href: `mailto:${s.contact.email}` },
  ];
  return (
    <PageShell title={contact.title} intro={contact.intro} homeLabel={t.common.home}>
      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        <ContactForm />
        <aside className="space-y-8 rounded-lg bg-charcoal p-8 text-white">
          <ul className="space-y-4">
            {rows.map((r) => (
              <li key={r.label}>
                <a href={r.href} target={r.external ? "_blank" : undefined} rel={r.external ? "noopener" : undefined} className="flex min-h-11 items-center gap-3 hover:underline">
                  <r.icon size={20} className="shrink-0 text-white/60" /> {r.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex gap-3 border-t border-white/10 pt-6">
            <PinIcon size={20} className="mt-0.5 shrink-0 text-white/60" />
            <div>
              <p className="label text-white/60">Showroom</p>
              <p className="mt-2">{s.address.line}<br />{s.address.area}, {s.address.city} {s.address.postalCode}<br />{s.address.country}</p>
            </div>
          </div>
          <ul className="space-y-1 border-t border-white/10 pt-6 text-sm text-white/80">
            {s.hours.map((h) => <li key={h.label} className="flex justify-between gap-4"><span>{h.label}</span><span>{h.value}</span></li>)}
          </ul>
        </aside>
      </div>
    </PageShell>
  );
}
