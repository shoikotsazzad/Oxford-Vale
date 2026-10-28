import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { CollectionDTO } from "@/lib/types";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";
import { BrandImage } from "./BrandImage";

/** Editorial tiles for featured collections: one large, two narrow on desktop. */
export function CollectionMosaic({ items, t }: { items: (CollectionDTO & { line: string })[]; t: Dict }) {
  if (!items.length) return null;
  return (
    <section className="reveal py-12 md:py-16" aria-labelledby="collections-title">
      <Container>
        <h2 id="collections-title" className="font-serif text-3xl uppercase md:text-4xl">{t.home.collections}</h2>
        <ul className="mt-8 grid gap-4 md:h-[560px] md:grid-cols-[1.35fr_1fr_1fr]">
          {items.map((c) => (
            <li key={c.id} className="h-[420px] md:h-full">
              <Link href={`/collections/${c.slug}`} className="group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl bg-charcoal p-6 text-white md:p-8">
                <BrandImage
                  src={c.image || `/brand/col-${c.slug}.jpg`}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative">
                  <h3 className="font-serif text-3xl md:text-4xl">{c.name}</h3>
                  <p className="mt-2 max-w-xs text-sm text-white/80">{c.line}</p>
                  <span className="label mt-5 inline-flex items-center gap-2 border-b border-white/60 pb-1 transition-[gap] group-hover:gap-3">
                    {t.home.discover} <ArrowRightIcon size={14} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
