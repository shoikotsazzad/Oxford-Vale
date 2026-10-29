import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { CollectionDTO } from "@/lib/types";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";
import { BrandImage } from "./BrandImage";

/** Editorial tiles for featured collections: a swipe row on phones, one large and two narrow from md up. */
export function CollectionMosaic({ items, t }: { items: (CollectionDTO & { line: string })[]; t: Dict }) {
  if (!items.length) return null;
  return (
    <section className="reveal py-7 md:py-10 lg:py-16" aria-labelledby="collections-title">
      <Container>
        <h2 id="collections-title" className="font-serif text-xl sm:text-2xl lg:text-4xl lg:uppercase">{t.home.collections}</h2>
        <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:h-[420px] md:grid-cols-[1.35fr_1fr_1fr] md:gap-4 md:overflow-visible md:px-0 lg:mt-8 lg:h-[560px]">
          {items.map((c) => (
            <li key={c.id} className="h-[300px] w-[70%] shrink-0 snap-start sm:h-[340px] sm:w-[46%] md:h-full md:w-auto">
              <Link href={`/collections/${c.slug}`} className="group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl bg-charcoal p-5 text-white lg:p-8">
                <BrandImage
                  src={c.image || `/brand/col-${c.slug}.jpg`}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 40vw, 70vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative">
                  <h3 className="font-serif text-2xl lg:text-4xl">{c.name}</h3>
                  <p className="mt-1.5 line-clamp-2 max-w-xs text-xs text-white/80 lg:mt-2 lg:text-sm">{c.line}</p>
                  <span className="label mt-4 inline-flex items-center gap-2 border-b border-white/60 pb-1 transition-[gap] group-hover:gap-3">
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
