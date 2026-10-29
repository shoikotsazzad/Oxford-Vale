import { JsonLd } from "@/components/JsonLd";
import { site } from "@/data/site";
import type { StoreSettings } from "@/lib/types";
import { telHref } from "@/lib/phone";

const DAYS: Record<string, string> = { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday" };

/** ClothingStore + WebSite (with search action) structured data. */
export function StoreJsonLd({ settings }: { settings: StoreSettings }) {
  const sameAs = Object.values(settings.socials).filter(Boolean);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": site.schemaType,
          name: settings.storeName,
          description: site.description,
          url: site.url,
          image: new URL(site.ogImage, site.url).toString(),
          telephone: telHref(settings.contact.phone).replace("tel:", ""),
          email: settings.contact.email,
          priceRange: site.priceRange,
          currenciesAccepted: site.currency,
          paymentAccepted: site.paymentBrands.join(", "),
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address.line,
            addressLocality: settings.address.city,
            addressRegion: settings.address.area,
            postalCode: settings.address.postalCode,
            addressCountry: "GB",
          },
          openingHoursSpecification: site.hours.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days.map((d) => DAYS[d]), opens: h.opens, closes: h.closes })),
          ...(sameAs.length && { sameAs }),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: settings.storeName,
          url: site.url,
          potentialAction: { "@type": "SearchAction", target: `${site.url}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
        }}
      />
    </>
  );
}
