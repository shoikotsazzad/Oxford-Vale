import Image from "next/image";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { ProductCardDTO } from "@/lib/types";
import { imageSrc } from "@/lib/images";
import { formatBDT } from "@/lib/money";
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
    <section className="reveal py-12 md:py-16" aria-labelledby="look-title">
      <Container>
        <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
            <BrandImage src={look.image} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
          </div>
          <div>
            <p className="label text-muted">{t.home.shopTheLook}</p>
            <h2 id="look-title" className="mt-3 font-serif text-4xl uppercase md:text-5xl">{look.title}</h2>
            <p className="mt-4 max-w-md text-ink/75">{look.text}</p>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {products.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.slug}`} className="group flex items-center gap-4 py-4">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-sand">
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
              <span className="font-medium">{formatBDT(total)}</span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
