import type { StoreSettings } from "@/lib/types";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/Container";
import { BrandImage } from "./BrandImage";

export function NewSeasonBanner({ banner }: { banner: StoreSettings["newSeasonBanner"] }) {
  return (
    <section className="reveal py-6 md:py-8">
      <Container>
        <div className="relative grid overflow-hidden rounded-2xl bg-sand md:min-h-[420px] md:grid-cols-[1fr_1.15fr]">
          <div className="relative z-10 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16">
            <p className="label text-muted">{banner.eyebrow}</p>
            <h2 className="mt-4 max-w-[12ch] font-serif text-5xl leading-[0.95] uppercase md:text-6xl lg:text-7xl">{banner.title}</h2>
            <p className="mt-5 max-w-sm text-ink/75">{banner.text}</p>
            {banner.cta?.href && (
              <div className="mt-8">
                <ButtonLink href={banner.cta.href} arrow>{banner.cta.label}</ButtonLink>
              </div>
            )}
          </div>
          <div className="relative min-h-[300px] md:min-h-0">
            <BrandImage
              src={banner.image}
              alt=""
              fill
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover object-right"
              fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,#d9d3c7,transparent_60%)]" />}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
