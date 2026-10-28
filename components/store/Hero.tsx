import type { Dict } from "@/lib/i18n";
import type { StoreSettings } from "@/lib/types";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/Container";
import { BrandImage } from "./BrandImage";

export function Hero({ hero, t }: { hero: StoreSettings["hero"]; t: Dict }) {
  const [primary, secondary] = hero.ctas;
  const words = hero.title.split(" ");
  return (
    <section className="relative overflow-hidden border-b border-line">
      <Container className="relative flex min-h-[600px] flex-col justify-between py-8 md:min-h-[680px] md:py-12 lg:min-h-[calc(100svh-7rem)] lg:max-h-[880px]">
        <div className="relative z-20">
          <p className="max-w-[16ch] text-sm leading-relaxed tracking-[0.2em] uppercase md:text-base">{hero.subtitle}</p>
          <span className="mt-4 block h-px w-10 bg-ink" />
        </div>

        {/* Wordmark behind the model */}
        <h1 className="pointer-events-none absolute inset-x-0 top-[38%] z-0 -translate-y-1/2 text-center font-serif leading-[0.85] font-semibold tracking-[-0.02em] select-none md:top-1/2">
          <span className="block text-[21vw] md:hidden">{words[0]}</span>
          <span className="block text-[21vw] md:hidden">{words.slice(1).join(" ")}</span>
          <span className="hidden whitespace-nowrap [word-spacing:0.35em] md:block md:text-[11vw] xl:text-[10rem]">{hero.title}</span>
        </h1>

        {/* Cut-out model (public/brand/hero-model.png). On desktop it stands over the gap between the two words, so both stay readable. */}
        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto h-[56%] max-w-[340px] md:h-[68%] md:max-w-[420px] md:translate-x-[8vw] xl:h-[80%] xl:translate-x-[118px]">
          <BrandImage src={hero.image} alt="" fill priority sizes="(min-width: 768px) 440px, 90vw" className="object-contain object-bottom" />
        </div>

        <div className="relative z-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-3">
            {primary && <ButtonLink href={primary.href} arrow>{t.home.shopNow}</ButtonLink>}
            {secondary && <ButtonLink href={secondary.href} variant="secondary" className="bg-paper/70 backdrop-blur">{t.home.explore}</ButtonLink>}
          </div>
          <div className="hidden text-right md:block">
            <p className="label">{hero.eyebrow}</p>
            <p className="mt-1 max-w-[22ch] text-sm text-muted">{hero.note}</p>
            <span className="mt-3 ml-auto block h-px w-10 bg-ink" />
          </div>
        </div>
      </Container>
    </section>
  );
}
