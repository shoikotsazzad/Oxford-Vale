import Image from "next/image";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { ProductCardDTO } from "@/lib/types";
import { imageSrc, isPlaceholder } from "@/lib/images";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Price } from "@/components/ui/Price";
import { Container } from "@/components/Container";
import { ProductCard } from "./ProductCard";
import { Carousel } from "./Carousel";

/** grid: 2 → 5 columns. carousel: swipe row. list: app-style rows on phones and tablets, the grid from lg up. */
type Props = { title: string; intro?: string; href?: string; products: ProductCardDTO[]; t: Dict; layout?: "grid" | "carousel" | "list" };

export function ProductRow({ title, intro, href, products, t, layout = "grid" }: Props) {
  if (!products.length) return null;
  const viewAll = (className: string) =>
    href && (
      <Link href={href} className={`label flex shrink-0 items-center gap-2 ${className}`}>
        {t.home.viewAll} <ArrowRightIcon size={14} />
      </Link>
    );
  const grid = (className = "") => (
    <div className={`mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:mt-8 lg:grid-cols-5 ${className}`}>
      {products.map((p, i) => (
        // Small screens show the first few; "View all" has the rest.
        <div key={p.id} className={href && i >= 6 ? "max-lg:hidden" : href && i >= 4 ? "max-md:hidden" : undefined}>
          <ProductCard product={p} t={t} />
        </div>
      ))}
    </div>
  );
  return (
    <section className="reveal py-7 md:py-10 lg:py-16">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl lg:text-4xl lg:uppercase">{title}</h2>
            {intro && <p className="mt-1 text-sm text-muted lg:mt-2 lg:text-base">{intro}</p>}
          </div>
          {/* Small screens: a quiet link top-right. Desktop: underlined, beside the title or under the carousel. */}
          {viewAll(`text-muted hover:text-ink lg:hidden [&_svg]:hidden`)}
          {layout !== "carousel" && viewAll("hidden border-b border-ink pb-1 lg:flex")}
        </div>
        {layout === "carousel" && (
          <div className="mt-4 lg:-mt-11">
            <Carousel label={title} prevLabel={t.home.prev} nextLabel={t.home.next}>
              {products.map((p) => (
                <li key={p.id} className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[28%] lg:w-[calc((100%-4rem)/5)]">
                  <ProductCard product={p} t={t} sizes="(min-width: 1024px) 20vw, (min-width: 640px) 30vw, 44vw" />
                </li>
              ))}
            </Carousel>
            {href && <div className="mt-8 hidden justify-center lg:flex">{viewAll("border-b border-ink pb-1")}</div>}
          </div>
        )}
        {layout === "grid" && grid()}
        {layout === "list" && (
          <>
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
              {products.map((p) => <ProductListItem key={p.id} product={p} />)}
            </ul>
            {grid("hidden lg:grid")}
          </>
        )}
      </Container>
    </section>
  );
}

function ProductListItem({ product }: { product: ProductCardDTO }) {
  const src = imageSrc(product.image?.url);
  return (
    <li>
      <Link href={`/product/${product.slug}`} className="flex items-center gap-4 rounded-2xl bg-surface p-2.5 pr-4 ring-1 ring-line transition-colors active:bg-sand">
        <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
          <Image src={src} alt="" fill sizes="64px" unoptimized={isPlaceholder(src)} className="object-cover" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{product.name}</span>
          <span className="block truncate text-xs text-muted">{product.category}</span>
          <span className="mt-1 block text-sm"><Price price={product.price} salePrice={product.salePrice} /></span>
        </span>
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
          <ArrowRightIcon size={16} />
        </span>
      </Link>
    </li>
  );
}
