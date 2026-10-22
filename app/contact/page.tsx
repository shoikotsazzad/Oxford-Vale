import { site } from "@/data/site";
import { pages } from "@/data/pages";
import { buildMetadata } from "@/lib/seo";
import { telLink, whatsappLink } from "@/lib/contact";
import { Container, PageHeader } from "@/components/Container";
import { ContactForm } from "@/components/ContactForm";

export const metadata = buildMetadata("contact");

export default function ContactPage() {
  const a = site.address;
  const items = [
    { label: "Phone", value: site.phoneDisplay, href: telLink() },
    { label: "WhatsApp", value: "Chat with us", href: whatsappLink() },
    { label: "Email", value: site.email, href: `mailto:${site.email}` },
    { label: "Address", value: [a.street, a.area, a.city].filter(Boolean).join(", "), href: site.mapUrl || undefined },
    { label: "Hours", value: site.hoursText },
  ];

  return (
    <>
      <PageHeader title={pages.contact.heading} intro={pages.contact.intro} />
      <section className="py-16 md:py-24">
        <Container className="grid gap-12 md:grid-cols-2">
          <dl className="space-y-6">
            {items.map((it) => (
              <div key={it.label}>
                <dt className="text-sm font-semibold text-muted">{it.label}</dt>
                <dd className="mt-1 text-lg">
                  {it.href ? (
                    <a href={it.href} className="hover:text-accent" target={it.href.startsWith("http") ? "_blank" : undefined} rel="noopener">
                      {it.value}
                    </a>
                  ) : (
                    it.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div className="rounded-2xl border border-line p-6 md:p-8">
            <ContactForm />
          </div>
        </Container>

        {site.mapEmbedUrl && (
          <Container className="mt-12">
            <iframe
              src={site.mapEmbedUrl}
              title={`${site.name} location on Google Maps`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-80 w-full rounded-2xl border border-line"
            />
          </Container>
        )}
      </section>
    </>
  );
}
