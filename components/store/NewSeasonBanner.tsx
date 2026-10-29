import type { StoreSettings } from "@/lib/types";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/Container";
import { BrandImage } from "./BrandImage";

export function NewSeasonBanner({ banner }: { banner: StoreSettings["newSeasonBanner"] }) {
  return (
    <section className="reveal py-6 md:py-8">
      <Container>
        <div className="relative grid overflow-hidden rounded-3xl bg-sand md:min-h-[420px] md:grid-cols-[1.25fr_1fr] lg:min-h-[560px] lg:rounded-2xl">
          <div className="relative z-10 flex flex-col justify-center px-5 py-7 sm:px-8 md:px-10 md:py-12 lg:px-16">
            <p className="label text-muted">{banner.eyebrow}</p>
            <h2 className="mt-4 max-w-[12ch] font-serif text-3xl leading-[0.95] uppercase sm:text-4xl md:text-5xl lg:text-7xl">{banner.title}</h2>
            <p className="mt-3 max-w-sm text-sm text-ink/75 lg:mt-5 lg:text-base">{banner.text}</p>
            {banner.cta?.href && (
              <div className="mt-5 lg:mt-8">
                <ButtonLink href={banner.cta.href} arrow>{banner.cta.label}</ButtonLink>
              </div>
            )}
          </div>
          <div className="relative aspect-[4/3] md:aspect-auto">
            <BrandImage
              src={banner.image}
              alt=""
              fill
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover object-top"
              fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,#d9d3c7,transparent_60%)]" />}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
