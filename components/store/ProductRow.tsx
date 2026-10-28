import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { ProductCardDTO } from "@/lib/types";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";
import { ProductCard } from "./ProductCard";
import { Carousel } from "./Carousel";

type Props = { title: string; intro?: string; href?: string; products: ProductCardDTO[]; t: Dict; layout?: "grid" | "carousel" };

export function ProductRow({ title, intro, href, products, t, layout = "grid" }: Props) {
  if (!products.length) return null;
  const viewAll = href && (
    <Link href={href} className="label flex shrink-0 items-center gap-2 border-b border-ink pb-1">
      {t.home.viewAll} <ArrowRightIcon size={14} />
    </Link>
  );
  return (
    <section className="reveal py-12 md:py-16">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl uppercase md:text-4xl">{title}</h2>
            {intro && <p className="mt-2 text-muted">{intro}</p>}
          </div>
          {layout === "grid" && viewAll}
        </div>
        {layout === "carousel" ? (
          <div className="mt-6 md:-mt-11">
            <Carousel label={title} prevLabel={t.home.prev} nextLabel={t.home.next}>
              {products.map((p) => (
                <li key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[42%] md:w-[30%] lg:w-[calc((100%-4rem)/5)]">
                  <ProductCard product={p} t={t} sizes="(min-width: 1024px) 20vw, (min-width: 768px) 30vw, 72vw" />
                </li>
              ))}
            </Carousel>
            {viewAll && <div className="mt-8 flex justify-center">{viewAll}</div>}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-5">
            {products.map((p) => <ProductCard key={p.id} product={p} t={t} />)}
          </div>
        )}
      </Container>
    </section>
  );
}
