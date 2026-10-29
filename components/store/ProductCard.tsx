import Image from "next/image";
import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { ProductCardDTO } from "@/lib/types";
import { imageSrc, isPlaceholder } from "@/lib/images";
import { Price } from "@/components/ui/Price";

export function ProductCard({ product, t, priority = false, sizes = "(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw" }: { product: ProductCardDTO; t: Dict; priority?: boolean; sizes?: string }) {
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const main = imageSrc(product.image?.url);
  return (
    <article className="group relative">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sand">
        <Link href={`/product/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          <Image src={main} alt={product.image?.alt || product.name} fill sizes={sizes} priority={priority} unoptimized={isPlaceholder(main)} className={`object-cover transition duration-500 ${product.hoverImage ? "group-hover:opacity-0" : "group-hover:scale-[1.03]"}`} />
          {product.hoverImage && (
            <Image src={product.hoverImage.url} alt="" fill sizes={sizes} className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          )}
        </Link>
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col gap-1">
          {onSale && <span className="rounded bg-sale px-2 py-0.5 text-[10px] tracking-[0.14em] text-paper uppercase">{t.product.sale}</span>}
          {!product.inStock && <span className="rounded bg-ink/80 px-2 py-0.5 text-[10px] tracking-[0.14em] text-paper uppercase">{t.product.soldOut}</span>}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-0.5">
        <h3 className="text-sm leading-snug">
          <Link href={`/product/${product.slug}`} className="hover:underline underline-offset-4">{product.name}</Link>
        </h3>
        <Price price={product.price} salePrice={product.salePrice} className="text-sm text-ink/80" />
      </div>
    </article>
  );
}
