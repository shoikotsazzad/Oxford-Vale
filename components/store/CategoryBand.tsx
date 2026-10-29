import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { CategoryDTO } from "@/lib/types";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";
import { BrandImage } from "./BrandImage";

export function CategoryBand({ items, t }: { items: (CategoryDTO & { line: string })[]; t: Dict }) {
  if (!items.length) return null;
  return (
    <section className="py-5 lg:py-8" aria-labelledby="category-band-title">
      <Container>
        <div className="flex items-center justify-between">
          <h2 id="category-band-title" className="font-serif text-xl sm:text-2xl lg:sr-only">{t.home.categoriesShort}</h2>
          <Link href="/shop" className="label py-2 text-muted hover:text-ink lg:hidden">{t.home.viewAll}</Link>
        </div>

        {/* Phones and tablets: small tiles in one row. */}
        <ul className="mt-3 grid grid-cols-5 gap-2 sm:gap-4 lg:hidden">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/shop/${c.slug}`} className="group flex flex-col items-center gap-2 text-center">
                <span className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
                  <BrandImage
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 18vw, 20vw"
                    className="object-cover transition-transform duration-500 group-active:scale-95"
                    fallback={<span className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-muted">{c.name.charAt(0)}</span>}
                  />
                </span>
                <span className="w-full truncate text-[11px] leading-tight sm:text-sm">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="-mx-4 hidden snap-x snap-mandatory gap-3 overflow-x-auto rounded-none bg-night px-4 py-4 [scrollbar-width:none] sm:mx-0 sm:rounded-2xl sm:p-4 lg:grid lg:grid-cols-5 lg:gap-0 lg:overflow-visible lg:p-3">
          {items.map((c, i) => (
            <li key={c.id} className={`min-w-[78%] snap-start sm:min-w-[46%] lg:min-w-0 ${i > 0 ? "lg:border-l lg:border-white/10" : ""}`}>
              <Link href={`/shop/${c.slug}`} className="group flex h-full items-center gap-4 rounded-xl p-2 text-white transition-colors hover:bg-white/5 lg:gap-3 lg:p-2.5 2xl:gap-4">
                <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-lg bg-charcoal ring-1 ring-white/10 lg:w-[72px] 2xl:w-24">
                  <BrandImage
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    fallback={<span className="absolute inset-0 flex items-center justify-center font-serif text-3xl text-white/25">{c.name.charAt(0)}</span>}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-lg tracking-wide uppercase lg:text-[15px] lg:tracking-normal 2xl:text-lg">{c.name}</h3>
                  <p className="mt-1 text-sm leading-snug text-white/70 lg:text-xs 2xl:text-sm">{c.line}</p>
                  <span className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/30 px-3 text-[10px] tracking-[0.16em] uppercase transition-colors group-hover:bg-white group-hover:text-night">
                    {t.home.shop} <ArrowRightIcon size={12} />
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
