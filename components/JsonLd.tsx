import { site } from "@/data/site";

/** Renders any JSON-LD object safely. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const DAYS: Record<string, string> = {
  Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday",
};

/** LocalBusiness (or subtype) built from data/site.ts. Used in the root layout. */
export function LocalBusinessJsonLd() {
  const sameAs = Object.values(site.socials).filter(Boolean);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": site.schemaType,
        name: site.name,
        description: site.description,
        url: site.url,
        image: new URL(site.ogImage, site.url).toString(),
        logo: new URL(site.logo, site.url).toString(),
        telephone: site.phone,
        email: site.email,
        priceRange: site.priceRange,
        address: {
          "@type": "PostalAddress",
          streetAddress: site.address.street,
          addressLocality: site.address.area,
          addressRegion: site.address.city,
          postalCode: site.address.postalCode || undefined,
          addressCountry: site.address.country,
        },
        ...(site.geo && { geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng } }),
        ...(site.mapUrl && { hasMap: site.mapUrl }),
        openingHoursSpecification: site.hours.map((h) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: h.days.map((d) => DAYS[d]),
          opens: h.opens,
          closes: h.closes,
        })),
        ...(sameAs.length && { sameAs }),
      }}
    />
  );
}
