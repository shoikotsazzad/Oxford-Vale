import { getT } from "@/server/i18n";
import { buildMetadata } from "@/lib/seo";
import { about } from "@/data/pages";
import { PageShell, Sections } from "@/components/store/PageShell";
import { BrandImage } from "@/components/store/BrandImage";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = buildMetadata({ title: "Our Story", description: about.description, path: "/about" });

export default async function AboutPage() {
  const t = await getT();
  return (
    <PageShell title={about.title} intro={about.intro} homeLabel={t.common.home}>
      <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <Sections sections={about.sections} />
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/shop" arrow>{t.home.shopNow}</ButtonLink>
            <ButtonLink href="/contact" variant="secondary">{t.footer.contactUs}</ButtonLink>
          </div>
        </div>
        <div className="grid gap-4 self-start">
          {["/brand/about-1.jpg", "/brand/about-2.jpg"].map((src) => (
            <div key={src} className="relative aspect-[8/5] overflow-hidden rounded-lg bg-sand">
              <BrandImage src={src} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#e2ddd3,transparent_70%)]" />} />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
