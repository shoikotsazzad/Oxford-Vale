import Image from "next/image";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { ProductCardDTO } from "@/lib/types";
import { imageSrc } from "@/lib/images";
import { formatMoney } from "@/lib/money";
import { Price } from "@/components/ui/Price";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container } from "@/components/Container";
import { BrandImage } from "./BrandImage";

type Look = { title: string; text: string; image: string };

/** One outfit photo beside the products in it. */
export function ShopTheLook({ look, products, t }: { look: Look; products: ProductCardDTO[]; t: Dict }) {
  if (!products.length) return null;
  const total = products.reduce((sum, p) => sum + (p.salePrice ?? p.price), 0);
  return (
    <section className="reveal py-7 md:py-10 lg:py-16" aria-labelledby="look-title">
      <Container>
        <div className="grid items-center gap-5 md:grid-cols-2 md:gap-8 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-sand md:aspect-[4/5] lg:rounded-2xl">
            <BrandImage src={look.image} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover object-[center_25%] md:object-center" />
          </div>
          <div>
            <p className="label text-muted">{t.home.shopTheLook}</p>
            <h2 id="look-title" className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl lg:uppercase">{look.title}</h2>
            <p className="mt-3 max-w-md text-sm text-ink/75 lg:mt-4 lg:text-base">{look.text}</p>
            <ul className="mt-5 divide-y lg:mt-8 divide-line border-y border-line">
              {products.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.slug}`} className="group flex items-center gap-4 py-3 lg:py-4">
                    <div className="relative h-20 w-16 shrink-0 lg:h-24 lg:w-20 overflow-hidden rounded-md bg-sand">
                      <Image src={imageSrc(p.image?.url)} alt="" fill sizes="80px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted">{p.category}</p>
                      <h3 className="mt-0.5 text-sm group-hover:underline underline-offset-4">{p.name}</h3>
                      <Price price={p.price} salePrice={p.salePrice} className="mt-1 text-sm text-ink/80" />
                    </div>
                    <ArrowRightIcon size={18} className="shrink-0 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between text-sm">
              <span className="text-muted">{t.home.lookTotal}</span>
              <span className="font-medium">{formatMoney(total)}</span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
